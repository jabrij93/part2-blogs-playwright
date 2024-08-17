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
    })
  
    test('a new blog can be created', async ({ page }) => {
      await createBlog(page, 'a note created by playwright3', 'jabs3', 'www.consistency_leads_to_conviction.com', '80')
      await expect(page.getByText('added a note created by playwright3 by jabs3')).toBeVisible()
    })
  })
})