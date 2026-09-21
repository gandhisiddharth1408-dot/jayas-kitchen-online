function Footer() {
  return (
    <footer className="border-t border-green-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Business */}
          <div>
            <p className="text-lg font-bold text-green-700">
              Jaya's Kitchen
            </p>

            <p className="mt-3 max-w-sm leading-7 text-gray-600">
              Homemade food, fresh tiffin and catering
              services made with love in Manjalpur,
              Vadodara.
            </p>

            <p className="mt-3 font-medium text-gray-700">
              Pure Vegetarian
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-gray-900">
              Quick Links
            </h3>

            <div className="mt-4 flex flex-col items-start gap-3">
              <a
                href="/privacy-policy"
                className="text-gray-600 transition hover:text-green-700 hover:underline"
              >
                Privacy Policy
              </a>

              <a
                href="/terms"
                className="text-gray-600 transition hover:text-green-700 hover:underline"
              >
                Terms & Conditions
              </a>

              <a
                href="/refund-cancellation"
                className="text-gray-600 transition hover:text-green-700 hover:underline"
              >
                Refund & Cancellation Policy
              </a>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-gray-900">
              Contact & Support
            </h3>

            <div className="mt-4 space-y-3">
              <a
                href="mailto:jayaskitchen.support@gmail.com"
                className="block text-gray-600 transition hover:text-green-700 hover:underline"
              >
                jayaskitchen.support@gmail.com
              </a>

              <a
                href="https://wa.me/918320115632"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-full bg-green-700 px-5 py-2.5 font-semibold text-white transition hover:bg-green-800"
              >
                WhatsApp Us
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-100 pt-6 text-center">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Jaya's Kitchen.
            All rights reserved.
          </p>

          <p className="mt-2 text-xs text-gray-400">
            Homemade food • Pure Veg • Manjalpur, Vadodara
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
