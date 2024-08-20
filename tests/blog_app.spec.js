const { test, expect, beforeEach, describe } = require('@playwright/test');
const { loginWith, createBlog } = require('./helper.cjs');

describe('Blog app', () => {
  beforeEach(async ({ page, request }) => {
    await request.post('/api/testing/reset');
    await request.post('/api/users', {
      data: {
        name: 'Matti Luukkainen',
        username: 'mluukkai',
        password: 'salainen'
      }
    });

    // Intercept the request to the blogs API endpoint
    await page.route('**/api/blogs', (route) => {
      // Mocked blog data with the user field populated
      const mockedBlogs = [
        {
          id: '56c38c89ff3cac133d3ce9c6',
          title: 'a note created by playwright5',
          author: 'jabs5',
          url: 'www.consistency_leads_to_conviction.com',
          likes: '70',
          user: {
            username: 'mluukkai',
            name: 'Matti Luukkainen',
            id: '66c38c88ff3cac133d3ce9bb'
          }
        },
        {
          id: '66c38c89ff3cac133d3ce9c5',
          title: 'a note created by playwright6',
          author: 'jabs6',
          url: 'www.consistency_leads_to_conviction.com',
          likes: '80',
          user: {
            username: 'mluukkai',
            name: 'Matti Luukkainen',
            id: '66c38c88ff3cac133d3ce9ba'
          }
        }
      ];

      // Fulfill the request with the mocked response
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockedBlogs)
      });
    });

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
    beforeEach(async ({ page }) => {
      await page.getByRole('button', { name: 'login' }).click()
      await page.getByTestId('username').fill('mluukkai')
      await page.getByTestId('password').fill('salainen')
      await page.getByRole('button', { name: 'login' }).click()
    });

    test('a blog can be deleted', async ({ page }) => {
      await loginWith(page, 'mluukkai', 'salainen');
       // Listen for the confirm dialog and accept it
       page.on('dialog', dialog => dialog.accept());

       await page.getByText('Title: a note created by playwright5')
       await page.getByRole('button', { name: 'show' }).click()
       const locator = await page.getByText('delete')
       await expect(locator).toBeVisible()
       // await page.getByRole('button', { name: 'delete' }).click()
       
       await expect(page.getByText('a note created by playwright5')).not.toBeVisible()
    });
  });
});
