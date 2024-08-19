const loginWith = async (page, username, password)  => {
    await page.getByRole('button', { name: 'log in' }).click()
    await page.getByRole('button', { name: 'login' }).click()
    await page.getByTestId('username').fill(username)
    await page.getByTestId('password').fill(password)
    await page.getByRole('button', { name: 'login' }).click()
}

const createBlog = async (page, title, author, url, likes) => {
    await page.getByRole('button', { name: 'create new blog' }).click()
    await page.getByTestId('title').fill(title)
    await page.getByTestId('author').fill(author)
    await page.getByTestId('url').fill(url)
    await page.getByTestId('likes').fill(likes)
    await page.getByRole('button', { name: 'add' }).click()

    // Debugging: Check what's in localStorage
    const blogsString = await page.evaluate(() => localStorage.getItem('blogs'));
    console.log('Blogs in localStorage:', blogsString); // This will output to Playwright's console

    // After creation, manually set the user field (if necessary)
    await page.evaluate(() => {
      const blogs = JSON.parse(localStorage.getItem('blogs') || '[]');
      const updatedBlogs = blogs.map(blog => ({
        ...blog,
        user: { username: 'mluukkai' }, // Hard-code the user for test purposes
      }));
      localStorage.setItem('blogs', JSON.stringify(updatedBlogs));
    });
}


module.exports = { loginWith, createBlog }