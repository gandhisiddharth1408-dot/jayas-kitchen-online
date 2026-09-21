function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#FFFDF5]">
      <header className="border-b border-green-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
          <div>
            <p className="text-sm font-semibold text-green-700">
              Jaya's Kitchen
            </p>

            <h1 className="text-xl font-bold text-gray-900">
              Privacy Policy
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
                1. Introduction
              </h2>

              <p className="mt-3 leading-7">
                Jaya's Kitchen respects your privacy and is
                committed to protecting the personal information
                you provide when using our website and placing
                an order.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">
                2. Information We Collect
              </h2>

              <p className="mt-3 leading-7">
                When you place an order, we may collect
                information such as your name, phone number,
                delivery address, order details, and payment
                related information required to process your
                order.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">
                3. How We Use Your Information
              </h2>

              <p className="mt-3 leading-7">
                We use the information provided by customers to
                process and deliver orders, communicate about
                orders, provide customer support, and maintain
                our ordering service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">
                4. Payments
              </h2>

              <p className="mt-3 leading-7">
                Online payments are processed through Razorpay.
                Jaya's Kitchen does not directly receive or store
                your complete card, UPI, or banking credentials.
                Payment processing is handled by the payment
                service provider according to its applicable
                policies.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">
                5. Information Sharing
              </h2>

              <p className="mt-3 leading-7">
                We may share necessary information with service
                providers involved in processing payments or
                fulfilling and delivering your order. We do not
                sell customer personal information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">
                6. Data Security
              </h2>

              <p className="mt-3 leading-7">
                We take reasonable measures to protect customer
                information from unauthorized access, misuse,
                alteration, or disclosure.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">
                7. Cookies and Website Technologies
              </h2>

              <p className="mt-3 leading-7">
                Our website may use standard browser technologies
                or similar technologies required for the website
                and ordering functionality to operate correctly.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900">
                8. Contact Us
              </h2>

              <p className="mt-3 leading-7">
                If you have questions about this Privacy Policy
                or how your information is handled, please
                contact us at:
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

export default PrivacyPolicy