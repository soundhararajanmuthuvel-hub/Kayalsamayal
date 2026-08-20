"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Phone, Mail, MapPin, CheckCircle, AlertCircle, MessageCircle } from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "Inquiry",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const validateField = (name: string, value: string) => {
    let err = "";
    if (name === "name" && !value.trim()) {
      err = "Name is required.";
    } else if (name === "email") {
      if (!value.trim()) {
        err = "Email is required.";
      } else {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regex.test(value)) {
          err = "Enter a valid email address.";
        }
      }
    } else if (name === "message" && !value.trim()) {
      err = "Message cannot be empty.";
    }
    setErrors((prev) => ({ ...prev, [name]: err }));
    return !err;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    validateField(name, value);
  };

  const isFormValid =
    form.name.trim() !== "" &&
    form.email.trim() !== "" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) &&
    form.message.trim() !== "" &&
    Object.values(errors).every((x) => !x);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    
    // Mock successful submission
    setSuccess(true);
    setForm({ name: "", email: "", phone: "", subject: "Inquiry", message: "" });
    setErrors({});
  };

  return (
    <>
      <Header />
      <main className="relative bg-cream-50 pt-20">
        
        {/* Banner */}
        <section className="bg-spice-gradient py-12 text-center text-cream-50 border-b border-gold-500/10">
          <div className="max-w-7xl mx-auto px-4 space-y-2">
            <span className="font-body text-xs font-bold tracking-[0.2em] uppercase text-gold-500">
              GET IN TOUCH
            </span>
            <h1 className="font-display font-black text-3xl sm:text-4xl leading-tight">
              Contact Us
            </h1>
            <div className="divider-spice mx-auto bg-gold-gradient" />
          </div>
        </section>

        {/* Content columns */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            
            {/* Left: Contact Form */}
            <div className="bg-white rounded-3xl border border-cream-300 p-6 sm:p-10 shadow-xs space-y-6">
              <h2 className="font-display font-bold text-brand-purple text-xl">Send Us a Message</h2>
              
              {success ? (
                <div className="bg-green-50 border border-green-200 text-green-800 p-6 rounded-2xl flex flex-col items-center text-center gap-3">
                  <CheckCircle className="text-green-600" size={36} />
                  <h3 className="font-display font-bold text-base">Inquiry Submitted Successfully!</h3>
                  <p className="font-body text-xs sm:text-sm">
                    Thank you for reaching out. Our support representative will get back to you shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="block font-body text-xs font-bold uppercase tracking-wider text-brand-purple">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full font-body text-sm bg-cream-50 border rounded-xl px-4 py-3 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-brand-orange text-espresso-950 placeholder-espresso-950/40 ${
                        errors.name ? "border-red-400" : form.name ? "border-green-400" : "border-cream-300"
                      }`}
                      placeholder="Enter your name"
                    />
                    {errors.name && (
                      <p className="flex items-center gap-1 font-body text-[0.7rem] text-red-500 font-semibold mt-1">
                        <AlertCircle size={10} /> {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="block font-body text-xs font-bold uppercase tracking-wider text-brand-purple">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full font-body text-sm bg-cream-50 border rounded-xl px-4 py-3 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-brand-orange text-espresso-950 placeholder-espresso-950/40 ${
                        errors.email ? "border-red-400" : form.email ? "border-green-400" : "border-cream-300"
                      }`}
                      placeholder="Enter your email"
                    />
                    {errors.email && (
                      <p className="flex items-center gap-1 font-body text-[0.7rem] text-red-500 font-semibold mt-1">
                        <AlertCircle size={10} /> {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="block font-body text-xs font-bold uppercase tracking-wider text-brand-purple">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className="w-full font-body text-sm bg-cream-50 border border-cream-300 rounded-xl px-4 py-3 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-brand-orange text-espresso-950 placeholder-espresso-950/40"
                      placeholder="Enter your mobile number"
                    />
                  </div>

                  {/* Subject Dropdown */}
                  <div className="space-y-1.5">
                    <label className="block font-body text-xs font-bold uppercase tracking-wider text-brand-purple">
                      Subject
                    </label>
                    <select
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      className="w-full font-body text-sm bg-cream-50 border border-cream-300 rounded-xl px-4 py-3 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-brand-orange text-brand-purple"
                    >
                      <option value="Inquiry">General Inquiry</option>
                      <option value="Order Help">Order Assistance</option>
                      <option value="Feedback">Feedback / Suggestions</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Message */}
                  <div className="space-y-1.5">
                    <label className="block font-body text-xs font-bold uppercase tracking-wider text-brand-purple">
                      Your Message *
                    </label>
                    <textarea
                      name="message"
                      rows={4}
                      value={form.message}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full font-body text-sm bg-cream-50 border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-orange text-espresso-950 placeholder-espresso-950/40 ${
                        errors.message ? "border-red-400" : form.message ? "border-green-400" : "border-cream-300"
                      }`}
                      placeholder="Type your message here..."
                    />
                    {errors.message && (
                      <p className="flex items-center gap-1 font-body text-[0.7rem] text-red-500 font-semibold mt-1">
                        <AlertCircle size={10} /> {errors.message}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={!isFormValid}
                      className={`btn-primary w-full justify-center text-sm font-bold py-3.5 px-6 rounded-xl flex items-center gap-2 min-h-[48px] cursor-pointer ${
                        !isFormValid ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      Send Message
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Right: Contact Coordinates */}
            <div className="bg-white rounded-3xl border border-cream-300 p-6 sm:p-10 shadow-xs space-y-8">
              <h2 className="font-display font-bold text-brand-purple text-xl">Contact Information</h2>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange shrink-0">
                    <MessageCircle size={18} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-brand-purple text-sm">WhatsApp Orders</h3>
                    <a
                      href="https://wa.me/919003860616"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-body text-espresso-900 text-sm hover:text-brand-orange transition-colors"
                    >
                      +91 9003860616
                    </a>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange shrink-0">
                    <Phone size={18} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-brand-purple text-sm">Call Support</h3>
                    <a
                      href="tel:+919003860616"
                      className="font-body text-espresso-900 text-sm hover:text-brand-orange transition-colors"
                    >
                      (+91) 9003860616
                    </a>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange shrink-0">
                    <Mail size={18} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-brand-purple text-sm">Email Coordinates</h3>
                    <a
                      href="mailto:kpmsamayal@gmail.com"
                      className="font-body text-espresso-900 text-sm hover:text-brand-orange transition-colors break-all"
                    >
                      kpmsamayal@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-brand-purple text-sm">Heritage Address</h3>
                    <p className="font-body text-espresso-900 text-xs sm:text-sm leading-relaxed">
                      No.504, Housing Board Ph1,<br />Tirupattur – 635601, Tamil Nadu
                    </p>
                  </div>
                </div>
              </div>

              {/* Hours / Response stats */}
              <div className="border-t border-cream-200 pt-6 space-y-2">
                <p className="font-body text-xs text-espresso-800 font-bold uppercase tracking-wider text-brand-orange">
                  Business Hours
                </p>
                <p className="font-body text-espresso-900 text-xs sm:text-sm leading-relaxed">
                  Monday to Saturday: 9:00 AM – 6:00 PM IST<br />
                  <span className="font-bold text-brand-purple text-xs">Response SLA: 2 to 4 hours</span>
                </p>
              </div>
            </div>

          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
