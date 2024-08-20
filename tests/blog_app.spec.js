const { test, expect, beforeEach, describe } = require('@playwright/test');
const { loginWith, createBlog } = require('./helper.cjs');

describe('Blog app', () => {
  let mockedBlogs;

  beforeEach(async ({ page, request }) => {
    // Step 1: Reset the database
    await request.post('/api/testing/reset');
  
    // Step 2: Register the user with a fixed _id
    const fixedUserId = '66c46c2d1ec2be204cdee734'; // Fixed id
    await request.post('/api/users', {
      data: {
        _id: fixedUserId,
        name: 'Matti Luukkainen',
        username: 'mluukkai',
        password: 'salainen'
      }
    });
  
    // Step 3: Initialize the mock data for blogs
    mockedBlogs = [
      {
        id: '66a3d13c2ed207561a14a43a',
        title: 'testadd',
        author: 'jabss',
        url: 'www.consistency.com',
        likes: 40,
        user: {
          username: 'mluukkai',
          name: 'Matti Luukkainen',
          id: fixedUserId
        }
      },
      {
        id: '66aa543f231fe8e6a4e121da',
        title: 'testzzzz',
        author: 'ewqeqwewq',
        url: 'ewqewq.com',
        likes: 293,
        user: {
          username: 'mluukkai',
          name: 'Matti Luukkainen',
          id: fixedUserId
        }
      },
      {
        id: '66aa5681231fe8e6a4e121ff',
        title: 'test_add_new_bloggg',
        author: 'test add new blog',
        url: 'www.keep_going.comzz',
        likes: 370,
        user: {
          username: 'mluukkai',
          name: 'Matti Luukkainen',
          id: fixedUserId
        }
      }
    ];
  
    // Step 4: Intercept the request to the blogs API endpoint
    await page.route('**/api/blogs', (route, request) => {
      if (request.method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockedBlogs)
        });
      } else if (request.method() === 'DELETE') {
        const url = new URL(request.url());
        const blogId = url.pathname.split('/').pop();
  
        // Remove the blog with the matching ID from the mocked data
        mockedBlogs = mockedBlogs.filter(blog => blog.id !== blogId);
  
        route.fulfill({
          status: 204, // No Content
        });
      } else if (request.method() === 'POST') {
        // Handle adding a new blog
        const newBlog = JSON.parse(request.postData());
        newBlog.id = `66c${Math.floor(Math.random() * 1e8).toString(16)}`; // Generate a new ID for the blog
        newBlog.user = {
          username: 'mluukkai',
          name: 'Matti Luukkainen',
          id: fixedUserId
        };
        mockedBlogs.push(newBlog);
  
        route.fulfill({
          status: 201, // Created
          contentType: 'application/json',
          body: JSON.stringify(newBlog)
        });
      } else {
        route.continue(); // Let other requests pass through
      }
    });
  
    // Step 5: Navigate to the application page
    await page.goto('/');
  });

  test('Login form is shown', async ({ page }) => {
    await page.goto('/');
    
    const locator = await page.getByText('Blogs');
    await expect(locator).toBeVisible();
    await expect(page.getByText('Blog app, Department of Computer Science, University of Helsinki 2024')).toBeVisible();
  });

  describe('Login', () => {
    test('succeeds with correct credentials', async ({ page }) => {
      await page.getByRole('button', { name: 'log in' }).click();
      await page.getByTestId('username').fill('mluukkai');
      await page.getByTestId('password').fill('salainen');
      await page.getByRole('button', { name: 'login' }).click();
  
      await expect(page.getByText('Matti Luukkainen logged in')).toBeVisible();
    });

    test('fails with wrong credentials', async ({ page }) => {
      await page.getByRole('button', { name: 'log in' }).click();
      await page.getByTestId('username').fill('mluukkai');
      await page.getByTestId('password').fill('wrong');
      await page.getByRole('button', { name: 'login' }).click();
    
      const errorMessage = page.getByText('wrong username or password');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toHaveCSS('border-style', 'solid');
      await expect(errorMessage).toHaveCSS('color', 'rgb(255, 0, 0)'); // 'red' in RGB format

      await expect(page.getByText('Matti Luukkainen logged in')).not.toBeVisible();
    });
  });

  describe.only('When logged in', () => {
    // beforeEach(async ({ page }) => {
    //   await loginWith(page, 'mluukkai', 'salainen')
    // });
    test('add blog to db', async ({ page, request }) => {
      
      const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Im1sdXVra2FpIiwiaWQiOiI2NmM0YWU2MjI3OTQ0NjYzNzg0OTZjMWIiLCJpYXQiOjE3MjQxNjU4NDUsImV4cCI6MTcyNDE2OTQ0NX0.jzjzbNzN3CFsh5C0Wz9u19SHtkgqWDQTtkh27iC2DLg";
        
      // Insert the blog data
      await request.post('/api/blogs', {
        data: {
          title: 'a note created by playwright6',
          author: 'jabs6',
          url: 'www.consistency_leads_to_conviction.com',
          likes: '80'
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
    });

    test('a blog can be deleted', async ({ page }) => {
      await loginWith(page, 'mluukkai', 'salainen');
       // Listen for the confirm dialog and accept it
       page.on('dialog', async dialog => {
        if (dialog.type() === 'confirm') {
          await dialog.accept(); // This line accepts the confirm dialog (equivalent to clicking "Ok")
        } else {
          await dialog.dismiss(); // This handles other types of dialogs, though it's optional
        }
      });

       const showButtons = page.getByRole('button', { name: 'show' });
       await showButtons.nth(0).click(); // Clicks the first "show" button

       // Locate the delete button associated with the first blog
       const deleteButton = page.locator('div')
            .filter({ hasText: 'a note created by playwright6' })
            .getByRole('button', { name: 'delete' });

       await expect(deleteButton).toBeVisible();
       await deleteButton.click();

       // Add a small delay to ensure UI updates
       // await page.waitForTimeout(500); // Adjust this delay as needed

       await expect(page.getByText('a note created by playwright6')).not.toBeVisible();
    });

    
  });
});