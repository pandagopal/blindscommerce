"use client";

import Link from "next/link";
import { FaCheck, FaTimes, FaArrowRight, FaWifi, FaHandPointer } from "react-icons/fa";

export default function MotorizedVsCordlessPage() {
  const comparisonData = [
    {
      feature: "Price Range",
      motorized: "$150 - $500+ per window",
      cordless: "$40 - $150 per window",
    },
    {
      feature: "Power Source",
      motorized: "Battery, plug-in, or hardwired",
      cordless: "No power needed - manual operation",
    },
    {
      feature: "Smart Home",
      motorized: "Full integration available",
      cordless: "Not compatible",
    },
    {
      feature: "Ease of Use",
      motorized: "Push-button, voice, or app control",
      cordless: "Push up/pull down manually",
    },
    {
      feature: "Installation",
      motorized: "More complex, may need electrician",
      cordless: "Simple DIY installation",
    },
    {
      feature: "Maintenance",
      motorized: "Battery changes, motor servicing",
      cordless: "Almost maintenance-free",
    },
    {
      feature: "Child Safety",
      motorized: "Completely cordless - safest option",
      cordless: "Cordless - very safe",
    },
    {
      feature: "Best For",
      motorized: "Hard-to-reach, large, or many windows",
      cordless: "Standard windows, budget-conscious",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-red-900 via-red-800 to-red-900 text-white py-10 lg:py-14">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block bg-white/20 text-white px-4 py-1 rounded-full text-sm font-medium mb-4">
              Buying Guide
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Motorized vs Cordless Blinds
            </h1>
            <p className="text-xl md:text-2xl text-red-200 mb-8">
              Both offer child safety without cords. Compare convenience, cost,
              and features to choose the right lift system for your home.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Answer */}
      <section className="py-12 bg-red-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl p-8 shadow-lg border-l-4 border-red-600">
              <h2 className="text-2xl font-bold mb-4">Quick Answer</h2>
              <p className="text-lg text-gray-700 mb-4">
                <strong>Choose Motorized Blinds</strong> if you have hard-to-reach windows,
                want smart home integration, have many windows to control, or value maximum
                convenience and luxury.
              </p>
              <p className="text-lg text-gray-700">
                <strong>Choose Cordless Blinds</strong> if you want child safety without
                the extra cost, have standard accessible windows, prefer simplicity, or
                are on a budget.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Comparison */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
            {/* Motorized */}
            <div className="bg-gradient-to-br from-red-100 to-red-100 rounded-2xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
                  <FaWifi className="text-3xl text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Motorized</h3>
                  <p className="text-red-700">Smart & Automated</p>
                </div>
              </div>
              <ul className="space-y-3">
                {[
                  "Control with remote, app, or voice",
                  "Set schedules for automatic operation",
                  "Works with Alexa, Google, HomeKit",
                  "Perfect for skylights & high windows",
                  "One-touch control for whole house",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <FaCheck className="text-red-600 mt-1 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cordless */}
            <div className="bg-gradient-to-br from-gray-100 to-slate-100 rounded-2xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center">
                  <FaHandPointer className="text-3xl text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Cordless</h3>
                  <p className="text-gray-600">Simple & Reliable</p>
                </div>
              </div>
              <ul className="space-y-3">
                {[
                  "Push up or pull down to operate",
                  "No batteries or power needed",
                  "No maintenance required",
                  "Lower cost, same child safety",
                  "Simple, proven technology",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <FaCheck className="text-gray-600 mt-1 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Feature Comparison
          </h2>
          <div className="max-w-5xl mx-auto overflow-x-auto">
            <table className="w-full bg-white rounded-xl shadow-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-4 font-semibold">Feature</th>
                  <th className="text-left p-4 font-semibold text-red-700">
                    Motorized
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-700">
                    Cordless
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {comparisonData.map((row, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                    <td className="p-4 font-medium">{row.feature}</td>
                    <td className="p-4 text-gray-700">{row.motorized}</td>
                    <td className="p-4 text-gray-700">{row.cordless}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Smart Home Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Smart Home Integration
          </h2>
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-900 text-white rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6 text-center">
                Motorized Blinds Work With:
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center mb-8">
                {[
                  { name: "Amazon Alexa", desc: "Voice control" },
                  { name: "Google Home", desc: "Voice & routines" },
                  { name: "Apple HomeKit", desc: "Siri & scenes" },
                  { name: "SmartThings", desc: "Full automation" },
                ].map((platform, i) => (
                  <div key={i} className="bg-white/10 rounded-lg p-4">
                    <div className="font-semibold">{platform.name}</div>
                    <div className="text-red-200 text-sm">{platform.desc}</div>
                  </div>
                ))}
              </div>
              <div className="text-center">
                <p className="text-red-200 mb-4">
                  Set schedules to open with sunrise, close at sunset, or sync with
                  your thermostat for energy savings.
                </p>
                <p className="text-sm text-red-300">
                  Note: Cordless blinds do not support smart home integration.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* When to Choose Each */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Best Choice by Situation
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Match your needs to the right lift system.
          </p>
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
            {[
              { situation: "High or Hard-to-Reach Windows", winner: "Motorized", reason: "No need to stretch or use a ladder" },
              { situation: "Skylights", winner: "Motorized", reason: "Only practical option for ceiling windows" },
              { situation: "Smart Home Setup", winner: "Motorized", reason: "Full voice and app control integration" },
              { situation: "Budget-Conscious", winner: "Cordless", reason: "Same safety at 1/3 the cost" },
              { situation: "Rental Property", winner: "Cordless", reason: "Lower investment, no electrical work" },
              { situation: "Many Windows", winner: "Motorized", reason: "Control all with one button or voice" },
              { situation: "Single Room", winner: "Cordless", reason: "Simple solution without extra features" },
              { situation: "Tech-Savvy Home", winner: "Motorized", reason: "Automation and scene control" },
            ].map((item, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold">{item.situation}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    item.winner === "Motorized"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-200 text-gray-800"
                  }`}>
                    {item.winner}
                  </span>
                </div>
                <p className="text-gray-600">{item.reason}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cost Analysis */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Cost Breakdown
          </h2>
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="bg-red-50 p-6 rounded-lg">
                  <h3 className="font-bold text-red-800 text-xl mb-4">Motorized (per window)</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>Base shade/blind: $50 - $150</li>
                    <li>Motor upgrade: +$100 - $250</li>
                    <li>Smart hub (one-time): $50 - $150</li>
                    <li className="font-semibold pt-2 border-t">Total: $150 - $500+</li>
                  </ul>
                </div>
                <div className="bg-gray-100 p-6 rounded-lg">
                  <h3 className="font-bold text-gray-800 text-xl mb-4">Cordless (per window)</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>Base shade/blind: $40 - $120</li>
                    <li>Cordless upgrade: +$0 - $30</li>
                    <li>No additional equipment</li>
                    <li className="font-semibold pt-2 border-t">Total: $40 - $150</li>
                  </ul>
                </div>
              </div>
              <p className="text-gray-600 text-center">
                <strong>10 Window Example:</strong> Motorized = $1,500 - $5,000+ | Cordless = $400 - $1,500
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto space-y-6 mt-12">
            {[
              {
                question: "Are motorized blinds worth the extra cost?",
                answer: "For hard-to-reach windows, skylights, or smart home enthusiasts, absolutely. The convenience of one-touch or voice control, plus scheduling capabilities, provides real daily value. For standard accessible windows where you rarely adjust blinds, cordless may be sufficient."
              },
              {
                question: "How long do motorized blind batteries last?",
                answer: "Most motorized blinds with rechargeable batteries last 6-12 months on a single charge with normal use. Solar-powered options can last indefinitely. Hardwired motorized blinds never need battery changes."
              },
              {
                question: "Can I convert cordless blinds to motorized later?",
                answer: "Some brands offer motor retrofit kits, but it's usually better and more cost-effective to buy motorized from the start. Converting typically requires replacing the entire headrail."
              },
              {
                question: "Which is safer for children - motorized or cordless?",
                answer: "Both are equally safe as neither has dangling cords. Cordless blinds operate with a push/pull mechanism, while motorized blinds use remotes or apps. Both are certified child-safe and meet WCMA standards."
              },
              {
                question: "Do motorized blinds work during power outages?",
                answer: "Battery-powered and rechargeable motorized blinds work independently of home power. Hardwired options may include battery backup. Most also have manual override options."
              },
              {
                question: "Are cordless blinds harder to operate on large windows?",
                answer: "Large windows with heavy shades can require more effort to lift with cordless operation. For windows over 60 inches wide or very tall windows, motorized or spring-assist mechanisms are recommended."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow">
                <h3 className="text-lg font-semibold mb-3">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-red-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Upgrade Your Windows
          </h2>
          <p className="text-xl text-red-200 mb-8 max-w-2xl mx-auto">
            Both motorized and cordless options provide cord-free safety and style.
            Free shipping on all orders over $99.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products?feature=motorized"
              className="bg-white hover:bg-gray-100 text-red-900 px-8 py-4 rounded-lg font-semibold text-lg transition-colors inline-flex items-center justify-center"
            >
              Shop Motorized <FaArrowRight className="ml-2" />
            </Link>
            <Link
              href="/products?feature=cordless"
              className="bg-red-700 hover:bg-red-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors inline-flex items-center justify-center"
            >
              Shop Cordless <FaArrowRight className="ml-2" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
