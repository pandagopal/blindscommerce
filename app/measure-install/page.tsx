import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Measuring & Installation Services | Smart Blinds Hub",
  description: "Professional measuring and installation services for your window treatments. Get the perfect fit with expert help.",
};

export default function MeasureInstallPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="bg-gray-100 rounded-lg p-8 mb-10">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Professional Measuring & Installation Services
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Get the perfect fit and finish with our expert measuring and
            installation services. Let the pros handle it so you don't have to.
          </p>
          <a
            href="#book-service"
            className="bg-primary-red hover:bg-primary-red-dark text-white font-medium py-3 px-6 rounded-lg transition-colors inline-block"
          >
            Book a Service
          </a>
        </div>
      </div>

      {/* Services Section */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold mb-8 text-center">Our Services</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Measuring Service */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="h-48 bg-gray-200">
              {/* Image placeholder */}
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">Measuring Service</h3>
              <p className="text-gray-600 mb-4">
                Our professional measuring ensures your window treatments will
                fit perfectly. Our experts will visit your home and take precise
                measurements for all your windows.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-primary-red mr-2 flex-shrink-0 mt-0.5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Precise measurements for perfect fitting</span>
                </li>
                <li className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-primary-red mr-2 flex-shrink-0 mt-0.5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Expert advice on mount types and options</span>
                </li>
                <li className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-primary-red mr-2 flex-shrink-0 mt-0.5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Identification of potential installation issues</span>
                </li>
              </ul>
              <div className="text-primary-red font-bold text-lg mb-4">
                $75 per visit*
              </div>
              <p className="text-sm text-gray-500">
                *Fee waived with purchase of $1,000 or more
              </p>
            </div>
          </div>

          {/* Installation Service */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="h-48 bg-gray-200">
              {/* Image placeholder */}
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">Installation Service</h3>
              <p className="text-gray-600 mb-4">
                Our professional installers will ensure your window treatments
                are installed correctly, efficiently, and to your satisfaction.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-primary-red mr-2 flex-shrink-0 mt-0.5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Expert installation by trained professionals</span>
                </li>
                <li className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-primary-red mr-2 flex-shrink-0 mt-0.5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Proper mounting for long-lasting performance</span>
                </li>
                <li className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-primary-red mr-2 flex-shrink-0 mt-0.5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Demonstration of product features and operation</span>
                </li>
                <li className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-primary-red mr-2 flex-shrink-0 mt-0.5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Clean-up and disposal of packaging materials</span>
                </li>
              </ul>
              <div className="text-primary-red font-bold text-lg mb-4">
                Starting at $149*
              </div>
              <p className="text-sm text-gray-500">
                *Price varies by number and type of window treatments
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Section */}
      <div className="mb-16" id="book-service">
        <h2 className="text-2xl font-bold mb-8 text-center">
          Book a Service Appointment
        </h2>

        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="first-name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  First Name
                </label>
                <input
                  type="text"
                  id="first-name"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="last-name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Last Name
                </label>
                <input
                  type="text"
                  id="last-name"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Address
              </label>
              <input
                type="text"
                id="address"
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label
                  htmlFor="city"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="state"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  State
                </label>
                <input
                  type="text"
                  id="state"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="zip"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  ZIP Code
                </label>
                <input
                  type="text"
                  id="zip"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="service-type"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Service Type
              </label>
              <select
                id="service-type"
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select a service</option>
                <option value="measuring">Measuring Service</option>
                <option value="installation">Installation Service</option>
                <option value="both">Both Services</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="preferred-date"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Preferred Date
                </label>
                <input
                  type="date"
                  id="preferred-date"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="alternate-date"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Alternate Date
                </label>
                <input
                  type="date"
                  id="alternate-date"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Additional Notes
              </label>
              <textarea
                id="notes"
                rows={4}
                className="w-full p-2 border border-gray-300 rounded-md"
              ></textarea>
            </div>

            <button
              type="submit"
              className="bg-primary-red hover:bg-primary-red-dark text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              Schedule Appointment
            </button>
          </form>
        </div>
      </div>

      {/* DIY Section */}
      <div className="mb-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Prefer to DIY?</h2>
          <p className="text-lg text-gray-600 mb-6">
            If you prefer to measure and install yourself, we've got detailed
            guides to help you every step of the way.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/measure-install/guide/measuring"
              className="bg-white border border-primary-red text-primary-red hover:bg-red-50 font-medium py-2 px-6 rounded-lg transition-colors"
            >
              View Measuring Guide
            </Link>
            <Link
              href="/measure-install/guide/installation"
              className="bg-white border border-primary-red text-primary-red hover:bg-red-50 font-medium py-2 px-6 rounded-lg transition-colors"
            >
              View Installation Guide
            </Link>
          </div>
        </div>
      </div>

      {/* FAQs */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold mb-8 text-center">
          Frequently Asked Questions
        </h2>

        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold mb-2">
              How much does measuring service cost?
            </h3>
            <p className="text-gray-600">
              Our measuring service is $75 per visit. However, this fee is
              waived if you purchase window treatments totaling $1,000 or more.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold mb-2">
              How long does installation take?
            </h3>
            <p className="text-gray-600">
              Installation time varies depending on the number and type of
              window treatments. On average, each window takes approximately
              20-30 minutes to install. Our team will provide a more accurate
              estimate when scheduling your appointment.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold mb-2">
              What areas do you service?
            </h3>
            <p className="text-gray-600">
              We currently offer measuring and installation services in select
              metropolitan areas. Enter your ZIP code during checkout to
              confirm service availability in your area.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold mb-2">
              Do I need to be home during the service?
            </h3>
            <p className="text-gray-600">
              Yes, an adult (18 years or older) must be present during both
              measuring and installation appointments to provide access to the
              home and approve the work.
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
          Let our professionals handle your window treatment measuring and
          installation for a perfect fit and finish.
        </p>
        <a
          href="#book-service"
          className="bg-primary-red hover:bg-primary-red-dark text-white font-medium py-3 px-6 rounded-lg transition-colors inline-block"
        >
          Book a Service
        </a>
      </div>
    </div>
  );
}
