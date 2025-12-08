import { test, expect } from '@playwright/test'
import { LoginPage } from '../pages/login-page'
import { faker } from '@faker-js/faker/locale/ar'
import { PASSWORD, SERVICE_URL, USERNAME } from '../../config/env-data'
import NotFoundPage from '../pages/not-found-page'
import { OrderPage } from '../pages/order-page'
import FoundPage from '../pages/found-page'

let loginPage: LoginPage

test.beforeEach(async ({ page }) => {
  loginPage = new LoginPage(page)
  await loginPage.open()
})

test('signIn button disabled when incorrect data inserted', async ({}) => {
  await loginPage.usernameField.fill(faker.lorem.word(2))
  await loginPage.passwordField.fill(faker.lorem.word(7))
  await expect(loginPage.signInButton).toBeDisabled()
})

test('login with correct credentials and verify order creation page', async ({}) => {
  const orderCreationPage = await loginPage.signIn(USERNAME, PASSWORD)
  await expect(orderCreationPage.statusButton).toBeVisible()
  await orderCreationPage.checkInnerComponentsVisible()
  // verify at least few elements on the order creation page
})

test('login and create order and check order found page', async ({ page }) => {
  const foundPage = new FoundPage(page)
  const orderInfo = {
    name: 'Nastya',
    phoneField: '123451233',
    comment: 'kittykat',
  }

  const orderCreationPage = await loginPage.signIn(USERNAME, PASSWORD)
  await orderCreationPage.nameField.fill(orderInfo.name)
  await orderCreationPage.phoneField.fill(orderInfo.phoneField)
  await orderCreationPage.commentField.fill(orderInfo.comment)
  await orderCreationPage.checkCreationPopupVisible(false)
  await orderCreationPage.createOrderButton.click()
  await page.waitForTimeout(1000)
  await orderCreationPage.checkCreationPopupVisible(true)
  const orderId = await orderCreationPage.getOrderIdFromPopup()
  await orderCreationPage.closeCreationPopup()
  await orderCreationPage.findOrderById(orderId)
  await foundPage.checkElementVisibility(foundPage.orderName)
})

test('logout button', async () => {
  const orderCreationPage = await loginPage.signIn(USERNAME, PASSWORD)
  await expect(orderCreationPage.logoutButton).toBeVisible()
  await orderCreationPage.logoutButton.click()
  await expect(loginPage.signInButton).toBeVisible()
})

test('Check not found page', async ({ page }) => {
  const notFoundPage = new NotFoundPage(page, `${SERVICE_URL}/orders/-1`)
  const orderPage = new OrderPage(page)

  await loginPage.signIn(USERNAME, PASSWORD)
  await orderPage.findOrderById(-1)
  await notFoundPage.checkElementVisibility(notFoundPage.title)
  await notFoundPage.checkElementVisibility(notFoundPage.description)
})
