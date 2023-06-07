const express = require('express');
const fetch = require('node-fetch');
const fs = require('fs');

const app = express();

// Read the current websites from config.json
const websites = JSON.parse(fs.readFileSync('config.json'));

// Initialize the status object
const status = {};
websites.forEach((website) => {
  status[website.name] = { url: website.url, status: 'unknown' };
});

// Function to check the status of all the websites
async function checkStatus() {
  for (const [name, website] of Object.entries(status)) {
    try {
      const response = await fetch(website.url);
      if (response.status >= 200 && response.status <= 299) {
        status[name].status = 'up';
      } else {
        status[name].status = 'down';
      }
    } catch (error) {
      status[name].status = 'down';
    }
  }
}

// Check the status of all the websites every 5 seconds
setInterval(checkStatus, 5000);

// Serve the status JSON object when the user visits /status
app.get('/status', (req, res) => {
  res.json(Object.values(status));
});

// API endpoint to add a website
app.post('/website', express.json(), (req, res) => {
  const name = req.body.name;
  const url = req.body.url;

  // Add the new website to config.json
  websites.push({ name, url });
  fs.writeFileSync('config.json', JSON.stringify(websites));

  // Add the new website to the status object
  status[name] = { url, status: 'unknown' };

  res.sendStatus(200);
});

// API endpoint to delete a website
app.delete('/website/:name', (req, res) => {
  const name = req.params.name;

  // Read the current websites from config.json
  const websites = JSON.parse(fs.readFileSync('config.json'));

  // Remove the website with the specified name from the list
  const index = websites.findIndex((website) => website.name === name);
  if (index !== -1) {
    websites.splice(index, 1);
  }

  // Write the updated list of websites to config.json
  fs.writeFileSync('config.json', JSON.stringify(websites));

  // Remove the website from the status object
  delete status[name];

  res.sendStatus(200);
});

// Serve the admin HTML page when the user visits /admin
app.get('/admin', (req, res) => {
  const adminPageHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Website Monitor Admin</title>
        <style>
          label {
            display: block;
            margin-bottom: 10px;
          }
        </style>
      </head>
      <body>
        <h1>Add a website</h1>
        <form id="add-form">
          <label for="name">Name</label>
          <input type="text" id="name" name="name" required>
          <label for="url">URL</label>
          <input type="url" id="url" name="url" required>
          <button type="submit">Add</button>
        </form>
        <h1>Delete a website</h1>
        <form id="delete-form">
          <label for="delete-name">Name</label>
          <select id="delete-name" name="name" required>
            <option value="">Select a website</option>
          </select>
          <button type="submit">Delete</button>
        </form>
        <script>
          const addForm = document.getElementById('add-form');
          const deleteForm = document.getElementById('delete-form');
          const deleteName = document.getElementById('delete-name');

          // Submit the add form on submit
          addForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const name = document.getElementById('name').value;
            const url = document.getElementById('url').value;
            await fetch('/website', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ name, url })
            });
            location.reload();
          });

          // Populate the delete form select with the current websites
          fetch('/status')
            .then(response => response.json())
            .then(status => {
              status.forEach(website => {
                const option = document.createElement('option');
                option.value = website.name;
                option.textContent = website.name;
                deleteName.appendChild(option);
              });
            });

          // Submit the delete form on submit
          deleteForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const name = deleteName.value;
            await fetch('/website/' + name, {
              method: 'DELETE'
           });
            location.reload();
          });
        </script>
      </body>
    </html>
  `;
  res.send(adminPageHtml);
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
