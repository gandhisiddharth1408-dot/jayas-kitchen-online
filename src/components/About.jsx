import kitchenImage from '../assets/menu/kitchen.jpg'

function About() {
  return (
    <section
      id="about"
      className="scroll-mt-24 bg-[#FFFDF5] px-4 py-20 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">

        {/* Heading */}
        <div className="mb-14 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-green-700">
            About Us
          </p>

          <h2 className="text-3xl font-bold text-green-900 sm:text-4xl lg:text-5xl">
            About Jaya's Kitchen
          </h2>

          <div className="mx-auto mt-5 h-1 w-16 rounded-full bg-green-700" />

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-gray-600 sm:text-lg">
            Homemade food, prepared with care and served with love.
          </p>
        </div>

        {/* Main About Content */}
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">

          {/* Image */}
          <div className="relative">
            <div className="overflow-hidden rounded-3xl shadow-xl">
              <img
                src={kitchenImage}
                alt="Jaya's Kitchen"
                className="h-[350px] w-full object-cover transition duration-500 hover:scale-105 sm:h-[450px]"
              />
            </div>

            {/* Floating Badge */}
            <div className="absolute -bottom-6 left-5 rounded-2xl bg-white px-5 py-4 shadow-xl sm:left-8">
              <p className="text-sm font-semibold text-green-800">
                Our Promise
              </p>

              <p className="mt-1 text-sm text-gray-600">
                Fresh & Homemade ❤️
              </p>
            </div>
          </div>

          {/* Text */}
          <div>
            <p className="mb-5 text-sm font-semibold uppercase tracking-wider text-green-700">
              Made Like Home
            </p>

            <h3 className="text-3xl font-bold leading-tight text-green-900 sm:text-4xl">
              Good food brings people together.
            </h3>

            <p className="mt-6 leading-7 text-gray-600">
              At Jaya's Kitchen, we believe that delicious food doesn't need
              to be complicated. Our meals are prepared with fresh
              ingredients, traditional recipes, and the same care you would
              expect from a homemade kitchen.
            </p>

            <p className="mt-4 leading-7 text-gray-600">
              From everyday tiffins to special Gujarati meals and catering,
              everything is prepared fresh so you can enjoy comforting,
              wholesome food wherever you are.
            </p>

            {/* Features */}
            <div className="mt-8 grid gap-4 sm:grid-cols-3">

              <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                <div className="mb-2 text-2xl">🥗</div>
                <h4 className="font-semibold text-green-900">
                  100% Vegetarian
                </h4>
                <p className="mt-1 text-xs leading-5 text-gray-600">
                  Pure vegetarian homemade food.
                </p>
              </div>

              <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                <div className="mb-2 text-2xl">🏠</div>
                <h4 className="font-semibold text-green-900">
                  Homemade
                </h4>
                <p className="mt-1 text-xs leading-5 text-gray-600">
                  Prepared with a homely touch.
                </p>
              </div>

              <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                <div className="mb-2 text-2xl">🌿</div>
                <h4 className="font-semibold text-green-900">
                  Fresh Daily
                </h4>
                <p className="mt-1 text-xs leading-5 text-gray-600">
                  Freshly prepared for every order.
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* Bottom Message */}
        <div className="mt-20 rounded-3xl bg-green-800 px-6 py-10 text-center shadow-lg sm:px-10">
          <h3 className="text-2xl font-bold text-white sm:text-3xl">
            From our kitchen to your table ❤️
          </h3>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-green-50">
            Whether you're looking for a daily tiffin, a wholesome meal, or
            catering for a special occasion, Jaya's Kitchen is here to serve
            you homemade goodness.
          </p>
        </div>

      </div>
    </section>
  )
}

export default About