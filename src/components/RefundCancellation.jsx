function RefundCancellation() {
  return (
    <div className="min-h-screen bg-[#FFFDF5]">
      <header className="border-b border-green-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
          <div>
            <p className="text-sm font-semibold text-green-700">
              Jaya's Kitchen
            </p>

            <h1 className="text-xl font-bold text-gray-900">
              Refund & Cancellation Policy
            </h1>
          </div>

          <a
            href="/"
            className="rounded-full border border-green-200 px-4 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-50"
          >
            Back to Website
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="rounded-3xl border border-green-100 bg-white p-6 shadow-sm sm:p-10">
          <p className="text-sm text-gray-500">
            Last updated: September 2026
          </p>

          <div className="mt-8 space-y-8 text-gray-700">
            <section>
              <h2 className="text-xl font-bold text-gray-900">
                1. Order Cancellation
              </h2>

              <p className="mt-3 leading-7">
                Customers who wish to cancel an order should
                contact Jaya's Kitchen as soon as possible after
                placing the order.
              </p>

              <p className="mt-3 leading-7">
                Cancellation requests may not be accepted once
                preparation of the food or delivery process has
                started.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">
                2. Refund Eligibility
              </h2>

              <p className="mt-3 leading-7">
                If an eligible order is cancelled before food
                preparation or dispatch has started, the customer
                may be eligible for a refund of the amount paid
                online.
              </p>

              <p className="mt-3 leading-7">
                Refund eligibility may depend on the circumstances
                of the cancellation and the status of the order.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">
                3. Online Payment Refunds
              </h2>

              <p className="mt-3 leading-7">
                For eligible online payments, refunds will be
                processed through the applicable payment system
                and, where supported, returned to the original
                payment method.
              </p>

              <p className="mt-3 leading-7">
                The time taken for the refunded amount to appear
                in the customer's account may depend on the
                payment provider and the customer's bank.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">
                4. Failed or Unsuccessful Payments
              </h2>

              <p className="mt-3 leading-7">
                If an online payment fails and the order is not
                successfully confirmed, customers should contact
                us if an amount has been deducted from their
                account.
              </p>

              <p className="mt-3 leading-7">
                We may verify the payment transaction before
                processing any applicable refund or resolving the
                order.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">
                5. Duplicate Payments
              </h2>

              <p className="mt-3 leading-7">
                If a customer is charged more than once for the
                same order due to a duplicate payment, the
                additional payment may be reviewed and refunded
                after verification.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">
                6. Order Issues
              </h2>

              <p className="mt-3 leading-7">
                If there is an issue with an order, such as an
                incorrect or missing item, customers should
                contact Jaya's Kitchen as soon as possible after
                receiving the order.
              </p>

              <p className="mt-3 leading-7">
                We will review the issue and determine the
                appropriate resolution based on the circumstances.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">
                7. Contact Us
              </h2>

              <p className="mt-3 leading-7">
                For cancellation requests, refund questions, or
                payment-related issues, please contact:
              </p>

              <a
                href="mailto:jayaskitchen.support@gmail.com"
                className="mt-3 inline-block font-semibold text-green-700 hover:underline"
              >
                jayaskitchen.support@gmail.com
              </a>

              <p className="mt-4 leading-7">
                Please include your order number and relevant
                payment details when contacting us about an order
                or refund.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}

export default RefundCancellation
