"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { brand, whatsappLink } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import {
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from "lucide-react";

export default function ContactClient() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "Product Inquiry",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.message) return;
    setSubmitted(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F8F4E9]">
      <Header />
      <main className="flex-1 pb-16 sm:pb-24">
        
        {/* Banner Section */}
        <section className="bg-[#0D2F22] py-12 sm:py-16 text-[#F8F4E9] border-b border-[#B88A3B]/30">
          <div className="container-page text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#B88A3B]">
              DIRECT CUSTOMER SUPPORT
            </span>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-white">
              Contact Kayal Samayal
            </h1>
            <p className="text-[#F8F4E9]/85 max-w-xl mx-auto text-xs sm:text-sm sm:text-base leading-relaxed">
              Have questions about our authentic blends, bulk orders, or shipping from Tirupattur? We are here to help you.
            </p>
          </div>
        </section>

        <div className="container-page pt-10 sm:pt-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Left Column: Direct Contact Details & Info */}
            <div className="lg:col-span-5 space-y-6">
              <div className="rounded-3xl border border-border bg-white p-6 sm:p-8 shadow-xs space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#B88A3B]">
                    Direct Contact
                  </span>
                  <h2 className="font-display font-bold text-2xl text-[#332820] mt-1">
                    Kayal Samayal Masala
                  </h2>
                </div>

                <div className="space-y-4 text-xs sm:text-sm text-[#6B5E54]">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F8F4E9] text-[#174D35]">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-[#332820]">Phone &amp; WhatsApp</p>
                      <a
                        href={`tel:${brand.phoneIntl}`}
                        className="text-[#174D35] font-semibold hover:underline block"
                      >
                        +91 {brand.phone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F8F4E9] text-[#174D35]">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-[#332820]">Email Support</p>
                      <a
                        href={`mailto:${brand.email}`}
                        className="text-[#174D35] font-semibold hover:underline block break-all"
                      >
                        {brand.email}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F8F4E9] text-[#174D35]">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-[#332820]">Kitchen &amp; Facility Address</p>
                      <p className="leading-relaxed">
                        {brand.address.line1}, {brand.address.city} – {brand.address.pincode}, {brand.address.state}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F8F4E9] text-[#174D35]">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-[#332820]">Support Hours</p>
                      <p>Monday – Saturday: 9:00 AM – 7:00 PM IST</p>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Action Card */}
                <div className="p-4 rounded-2xl bg-[#F8F4E9] border border-border space-y-3">
                  <div className="flex items-center gap-2 text-[#174D35] font-bold text-xs uppercase tracking-wider">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Instant WhatsApp Service</span>
                  </div>
                  <p className="text-xs text-[#6B5E54]">
                    Connect instantly with our team for immediate order packing status and catalogue inquiries.
                  </p>
                  <a
                    href={whatsappLink("Hi Kayal Samayal! I have an inquiry.")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button variant="whatsapp" size="touch" className="w-full gap-2 font-bold shadow-xs rounded-xl">
                      <MessageCircle className="h-4 w-4" />
                      <span>Chat on WhatsApp</span>
                    </Button>
                  </a>
                </div>

                {/* Legal Badge */}
                <div className="pt-2 text-xs text-[#6B5E54] space-y-1 border-t border-border">
                  <p><strong>FSSAI Reg No:</strong> {brand.fssai}</p>
                  <p><strong>GST Registration:</strong> {brand.gst}</p>
                </div>
              </div>
            </div>

            {/* Right Column: Contact Inquiry Form */}
            <div className="lg:col-span-7">
              <div className="rounded-3xl border border-border bg-white p-6 sm:p-10 shadow-xs space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#B88A3B]">
                    Send a Message
                  </span>
                  <h2 className="font-display font-bold text-2xl text-[#332820] mt-1">
                    How Can We Assist You?
                  </h2>
                  <p className="text-xs sm:text-sm text-[#6B5E54] mt-1">
                    Fill out the form below and we will get back to you promptly.
                  </p>
                </div>

                {submitted ? (
                  <div className="rounded-2xl bg-[#174D35]/10 border border-[#174D35]/30 p-6 text-center space-y-3 animate-in zoom-in-95">
                    <CheckCircle2 className="mx-auto h-12 w-12 text-[#174D35]" />
                    <h3 className="font-display font-bold text-xl text-[#332820]">
                      Thank You for Contacting Us!
                    </h3>
                    <p className="text-xs sm:text-sm text-[#6B5E54] max-w-md mx-auto">
                      We have received your message. Our customer care team in Tirupattur will connect with you via phone/WhatsApp shortly.
                    </p>
                    <Button
                      variant="forest"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => {
                        setSubmitted(false);
                        setForm({ name: "", email: "", phone: "", subject: "Product Inquiry", message: "" });
                      }}
                    >
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-[#332820]">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          placeholder="e.g. Ramesh Kannan"
                          className="w-full rounded-xl border border-border bg-[#F8F4E9] px-3.5 py-2.5 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#174D35]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-[#332820]">
                          Mobile Number *
                        </label>
                        <input
                          type="tel"
                          required
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          placeholder="10-digit mobile number"
                          className="w-full rounded-xl border border-border bg-[#F8F4E9] px-3.5 py-2.5 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#174D35]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-[#332820]">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          placeholder="name@example.com"
                          className="w-full rounded-xl border border-border bg-[#F8F4E9] px-3.5 py-2.5 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#174D35]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-[#332820]">
                          Subject
                        </label>
                        <select
                          value={form.subject}
                          onChange={(e) => setForm({ ...form, subject: e.target.value })}
                          className="w-full rounded-xl border border-border bg-[#F8F4E9] px-3.5 py-2.5 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#174D35] cursor-pointer"
                        >
                          <option value="Product Inquiry">Product Inquiry</option>
                          <option value="Bulk & Wholesale Orders">Bulk & Wholesale Orders</option>
                          <option value="Order Tracking">Order Tracking</option>
                          <option value="Feedback / Suggestions">Feedback / Suggestions</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#332820]">
                        Your Message *
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        placeholder="Tell us what you need or ask any questions..."
                        className="w-full rounded-xl border border-border bg-[#F8F4E9] px-3.5 py-2.5 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#174D35] resize-none"
                      />
                    </div>

                    <Button type="submit" variant="forest" size="touch" className="w-full font-bold shadow-md rounded-xl">
                      Send Inquiry
                    </Button>
                  </form>
                )}
              </div>
            </div>

          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
}
