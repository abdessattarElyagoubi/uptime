const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

let status = {};

// Middleware to parse JSON in request body
app.use(express.json());

// Function to check the availability of a website
async function checkWebsite(website) {
  try {
    await axios.head(website.url);
    status[website.name] = 'Up'; // Website is up
    console.log(`${website.name} is up`);
  } catch (error) {
    status[website.name] = 'Down'; // Website is down
    console.log(`${website.name} is down`);
  }
}

// Function to periodically update the status of the websites
async function updateStatus() {
  // Read the website configurations from config.json
  const websites = JSON.parse(fs.readFileSync('config.json'));

  await Promise.all(websites.map(checkWebsite));

  // Wait for 5 seconds before updating the status again
  setTimeout(updateStatus, 5000);
}

// API endpoint to get the status of the websites
app.get('/status', async (req, res) => {
  // Read the website configurations from config.json
  const websites = JSON.parse(fs.readFileSync('config.json'));

  // Check the status of each website
  const currentStatus = websites.map((website) => ({
    name: website.name,
    url: website.url,
    status: status[website.name] || 'Unknown',
  }));

  res.json(currentStatus);
});

// API endpoint to add a new website
app.post('/website', (req, res) => {
  const { name, url } = req.body;

  // Read the current websites from config.json
  const websites = JSON.parse(fs.readFileSync('config.json'));

  // Add the new website to the list
  websites.push({ name, url });

  // Write the updated list of websites to config.json
  fs.writeFileSync('config.json', JSON.stringify(websites));

  // Update the status object with the new website
  status[name] = 'Unknown';

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
            await fetch(`/website/${name}`, {
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

// Start updating the status of the websites
updateStatus();

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
