function TermsConditions() {
  return (
    <div className="min-h-screen bg-[#FFFDF5]">
      <header className="border-b border-green-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
          <div>
            <p className="text-sm font-semibold text-green-700">
              Jaya's Kitchen
            </p>

            <h1 className="text-xl font-bold text-gray-900">
              Terms & Conditions
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
                1. About Jaya's Kitchen
              </h2>

              <p className="mt-3 leading-7">
                Jaya's Kitchen provides homemade vegetarian
                food, tiffin, and catering services through its
                online ordering website.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">
                2. Placing an Order
              </h2>

              <p className="mt-3 leading-7">
                Customers are responsible for providing accurate
                information when placing an order, including
                their name, phone number, delivery address, and
                order details.
              </p>

              <p className="mt-3 leading-7">
                An order is considered successfully placed after
                the order has been accepted by our system and the
                customer receives an order confirmation.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">
                3. Menu and Pricing
              </h2>

              <p className="mt-3 leading-7">
                Menu items, availability, descriptions, and prices
                displayed on the website may change from time to
                time. The price applicable to an order is the
                price displayed at checkout when the order is
                placed.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">
                4. Delivery
              </h2>

              <p className="mt-3 leading-7">
                Customers must provide a correct and complete
                delivery address and contact number. Delivery
                availability and delivery charges may depend on
                the location and order.
              </p>

              <p className="mt-3 leading-7">
                Delivery times are estimates and may vary due to
                order volume, weather, traffic, or other
                circumstances.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">
                5. Online Payments
              </h2>

              <p className="mt-3 leading-7">
                Online payments are processed through Razorpay.
                Customers should complete payment using the
                available payment methods presented during
                checkout.
              </p>

              <p className="mt-3 leading-7">
                An order paid online is subject to successful
                payment confirmation and verification by the
                payment system.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">
                6. Order Cancellation
              </h2>

              <p className="mt-3 leading-7">
                Customers should contact Jaya's Kitchen as soon
                as possible if they need to request cancellation
                of an order. Cancellation may not be possible
                after food preparation or dispatch has started.
              </p>

              <p className="mt-3 leading-7">
                Any applicable refund will be handled according
                to our Refund & Cancellation Policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">
                7. Customer Responsibilities
              </h2>

              <p className="mt-3 leading-7">
                Customers agree to use the website for lawful
                purposes and to provide accurate information when
                placing orders.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">
                8. Website Availability
              </h2>

              <p className="mt-3 leading-7">
                We aim to keep the website available and
                functional, but temporary interruptions may occur
                due to maintenance, technical problems, or
                circumstances outside our control.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">
                9. Contact Us
              </h2>

              <p className="mt-3 leading-7">
                For questions about an order or these Terms &
                Conditions, please contact:
              </p>

              <a
                href="mailto:jayaskitchen.support@gmail.com"
                className="mt-3 inline-block font-semibold text-green-700 hover:underline"
              >
                jayaskitchen.support@gmail.com
              </a>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}

export default TermsConditions