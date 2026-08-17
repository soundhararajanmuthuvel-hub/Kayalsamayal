"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle,
} from "lucide-react";

const WA_NUMBER = "919003860616";
const WA_LINK = `https://wa.me/${WA_NUMBER}?text=Hi%20Kayal%20Samayal!%20I'd%20like%20to%20get%20in%20touch.`;

const contactInfo = [
  {
    icon: Phone,
    label: "Call Us / WhatsApp",
    value: "(+91) 9003860616",
    href: `tel:+${WA_NUMBER}`,
  },
  {
    icon: Mail,
    label: "Email Us",
    value: "kpmsamayal@gmail.com",
    href: "mailto:kpmsamayal@gmail.com",
  },
  {
    icon: MapPin,
    label: "Visit Us",
    value: "No.504, Housing Board Ph1, Tirupattur – 635601, Tamil Nadu",
    href: "https://maps.google.com/?q=Tirupattur,Tamil+Nadu",
  },
  {
    icon: Clock,
    label: "Business Hours",
    value: "Mon – Sat: 9:00 AM – 7:00 PM IST",
    href: null,
  },
];

export default function Contact() {
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Build WhatsApp message from form
    const msg = `Hi Kayal Samayal!\n\nName: ${form.name}\nPhone: ${form.phone}\n\nMessage: ${form.message}`;
    const waUrl = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setForm({ name: "", phone: "", message: "" });
    }, 4000);
  };

  return (
    <section id="contact" className="relative texture-paper py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.p
            className="section-eyebrow mb-3"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Get in Touch
          </motion.p>
          <motion.h2
            className="section-title mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Order, Enquire &{" "}
            <span className="gold-shimmer">Connect</span>
          </motion.h2>
          <motion.div
            className="divider-spice mb-6"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
          />
        </div>

        {/* WhatsApp CTA Banner */}
        <motion.div
          className="bg-spice-gradient rounded-2xl p-8 sm:p-10 text-center mb-12 shadow-2xl border border-gold-600/20"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 border border-white/20 mb-5">
            <MessageCircle size={30} className="text-cream-100" />
          </div>
          <h3 className="font-display font-bold text-cream-50 text-2xl sm:text-3xl mb-3">
            Ready to Order?
          </h3>
          <p className="font-body text-cream-300 text-base max-w-md mx-auto mb-6">
            The fastest way to order is directly on WhatsApp. We respond
            quickly and ship pan-India.
          </p>
          <a
            id="contact-whatsapp-cta-btn"
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp text-base px-8 py-3.5 inline-flex"
          >
            <MessageCircle size={20} />
            Chat on WhatsApp — (+91) 9003860616
          </a>
        </motion.div>

        {/* Two-column: Info + Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="space-y-6"
          >
            <h3 className="font-display font-semibold text-espresso-900 text-xl mb-6">
              Our Details
            </h3>
            {contactInfo.map((info) => (
              <div key={info.label} className="flex items-start gap-4">
                <div className="mt-0.5 flex-shrink-0 w-10 h-10 rounded-lg bg-gold-600/10 flex items-center justify-center">
                  <info.icon size={18} className="text-gold-600" />
                </div>
                <div>
                  <p className="font-body text-xs text-gold-700 font-semibold tracking-wide uppercase mb-0.5">
                    {info.label}
                  </p>
                  {info.href ? (
                    <a
                      href={info.href}
                      target={info.href.startsWith("http") ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className="font-body text-espresso-900 text-sm hover:text-rust-600 transition-colors"
                    >
                      {info.value}
                    </a>
                  ) : (
                    <p className="font-body text-espresso-900 text-sm">
                      {info.value}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* Embedded Google Map */}
            <div className="mt-6 rounded-xl overflow-hidden border border-cream-300 shadow-sm h-56">
              <iframe
                title="Tirupattur location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15564.8!2d78.9801!3d12.4962!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bac4f08e5b4a5ed%3A0x4a0ec0e31b9a0c8e!2sTirupattur%2C%20Tamil%20Nadu!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </motion.div>

          {/* Enquiry Form */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <h3 className="font-display font-semibold text-espresso-900 text-xl mb-6">
              Send Us a Message
            </h3>
            {submitted ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4 bg-green-50 rounded-xl border border-green-200">
                <CheckCircle size={40} className="text-green-600" />
                <p className="font-display text-espresso-900 text-lg font-semibold">
                  Message sent to WhatsApp!
                </p>
                <p className="font-body text-espresso-800 text-sm text-center max-w-xs">
                  A WhatsApp chat has opened. Continue the conversation there.
                </p>
              </div>
            ) : (
              <form
                id="contact-enquiry-form"
                onSubmit={handleSubmit}
                className="space-y-5"
                noValidate
              >
                <div>
                  <label
                    htmlFor="contact-name"
                    className="font-body text-xs font-semibold tracking-wide uppercase text-espresso-800 mb-1.5 block"
                  >
                    Your Name
                  </label>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    required
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Fatima Begum"
                    className="w-full font-body text-sm bg-white border border-cream-300 rounded-lg px-4 py-3 text-espresso-900 placeholder:text-espresso-800/40 focus:outline-none focus:border-gold-600 focus:ring-2 focus:ring-gold-600/20 transition"
                  />
                </div>
                <div>
                  <label
                    htmlFor="contact-phone"
                    className="font-body text-xs font-semibold tracking-wide uppercase text-espresso-800 mb-1.5 block"
                  >
                    Phone / WhatsApp Number
                  </label>
                  <input
                    id="contact-phone"
                    name="phone"
                    type="tel"
                    required
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full font-body text-sm bg-white border border-cream-300 rounded-lg px-4 py-3 text-espresso-900 placeholder:text-espresso-800/40 focus:outline-none focus:border-gold-600 focus:ring-2 focus:ring-gold-600/20 transition"
                  />
                </div>
                <div>
                  <label
                    htmlFor="contact-message"
                    className="font-body text-xs font-semibold tracking-wide uppercase text-espresso-800 mb-1.5 block"
                  >
                    Message / Order Details
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    required
                    rows={5}
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell us what you'd like to order or ask..."
                    className="w-full font-body text-sm bg-white border border-cream-300 rounded-lg px-4 py-3 text-espresso-900 placeholder:text-espresso-800/40 focus:outline-none focus:border-gold-600 focus:ring-2 focus:ring-gold-600/20 transition resize-none"
                  />
                </div>
                <button
                  type="submit"
                  id="contact-submit-btn"
                  className="btn-whatsapp w-full justify-center text-sm py-3.5"
                >
                  <Send size={16} />
                  Send via WhatsApp
                </button>
                <p className="font-body text-espresso-800 text-[0.7rem] text-center">
                  This will open WhatsApp with your message pre-filled.
                </p>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
