const { test, expect, beforeEach, describe } = require('@playwright/test')
const { loginWith, createBlog } = require('./helper.cjs')

describe('Blog app', () => {
  beforeEach(async ({ page, request }) => {
    await request.post('/api/testing/reset')
    await request.post('/api/users', {
      data: {
        name: 'Matti Luukkainen',
        username: 'mluukkai',
        password: 'salainen'
      }
    })

    await page.goto('/')
  })

  test('Login form is shown', async ({ page }) => {
    await page.goto('/')
    
    const locator = await page.getByText('Blogs')
    await expect(locator).toBeVisible()
    await expect(page.getByText('Blog app, Department of Computer Science, University of Helsinki 2024')).toBeVisible()
  })

  describe('Login', () => {
    test('succeeds with correct credentials', async ({ page }) => {
      await page.getByRole('button', { name: 'log in' }).click()
      await page.getByRole('button', { name: 'login' }).click()
        await page.getByTestId('username').fill('mluukkai')
        await page.getByTestId('password').fill('salainen')
        await page.getByRole('button', { name: 'login' }).click()
  
        await expect(page.getByText('Matti Luukkainen logged in')).toBeVisible()
    })

    test('fails with wrong credentials', async ({ page }) => {
      await page.getByRole('button', { name: 'log in' }).click()
      await page.getByRole('button', { name: 'login' }).click()
        await page.getByTestId('username').fill('mluukkai')
        await page.getByTestId('password').fill('wrong')
        await page.getByRole('button', { name: 'login' }).click()
    
        const errorMessage = page.getByText('wrong username or password');

        // Ensure the error message is visible first
        await expect(errorMessage).toBeVisible();

        // Check that the element has the correct CSS styles
        await expect(errorMessage).toHaveCSS('border-style', 'solid');
        await expect(errorMessage).toHaveCSS('color', 'rgb(255, 0, 0)'); // 'red' in RGB format

        await expect(page.getByText('Matti Luukkainen logged in')).not.toBeVisible()
    })
  })

  describe.only('When logged in', () => {
    beforeEach(async ({ page }) => {
      await loginWith(page, 'mluukkai', 'salainen')
      await createBlog(page, 'a note created by playwright2', 'jabs2', 'www.consistency_leads_to_conviction.com', '70')
      await createBlog(page, 'a note created by playwright3', 'jabs3', 'www.consistency_leads_to_conviction.com', '80')

      const token = await page.evaluate(() => localStorage.getItem('loggedBlogappUser'));
      console.log('Token:', token);
    })
  
    // test('a blog can be liked', async ({ page }) => {
    //   await page.getByText('a note created by playwright2')
    //   await page.getByRole('button', { name: 'show' }).click()
    //   await page.getByRole('button', { name: 'like' }).click()
    //   await expect(page.getByText('71')).toBeVisible()
    // })

    test('a blog can be deleted', async ({ page }) => {
      page.on('dialog', dialog => dialog.accept());

      await page.getByText('a note created by playwright3');
      await page.getByRole('button', { name: 'show' }).click();

      await page.pause();  // This will pause the test and open the Playwright inspector

      // Check logged-in user and blog user in the console
    const loggedInUser = await page.evaluate(() => localStorage.getItem('loggedBlogAppUser'));
    console.log('Logged in User:', JSON.parse(loggedInUser));
      
      const locator = await page.getByText('delete');
      await expect(locator).toBeVisible();

      await page.getByRole('button', { name: 'delete' }).click();

      await expect(page.getByText('a note created by playwright3')).not.toBeVisible();
    })
  })
})