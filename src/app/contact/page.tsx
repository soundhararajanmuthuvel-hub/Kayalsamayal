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

export default function ContactPage() {
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
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 pb-16 sm:pb-24">
        
        {/* Banner Section */}
        <section className="bg-spice-gradient py-12 sm:py-16 text-primary-foreground border-b border-white/10">
          <div className="container-page text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
              DIRECT CUSTOMER SUPPORT
            </span>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold">
              Get in Touch with Us
            </h1>
            <div className="divider-spice" />
            <p className="text-white/80 text-xs sm:text-sm max-w-xl mx-auto">
              Have questions about products, custom bulk orders, or shipping? Reach out directly via WhatsApp or message.
            </p>
          </div>
        </section>

        <div className="container-page pt-10 sm:pt-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Left: Contact Information Cards */}
            <div className="lg:col-span-5 space-y-6">
              <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-[var(--shadow-card)] space-y-6">
                <h2 className="font-display font-bold text-xl text-primary border-b border-border pb-3">
                  Business Information
                </h2>

                <div className="space-y-4 text-xs sm:text-sm">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl bg-accent text-secondary flex items-center justify-center shrink-0">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">Phone / WhatsApp</p>
                      <a href={`tel:${brand.phoneIntl}`} className="text-secondary hover:underline font-semibold block mt-0.5">
                        (+91) {brand.phone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl bg-accent text-secondary flex items-center justify-center shrink-0">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">Email Address</p>
                      <a href={`mailto:${brand.email}`} className="text-secondary hover:underline font-semibold block mt-0.5 break-all">
                        {brand.email}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl bg-accent text-secondary flex items-center justify-center shrink-0">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">Registered Kitchen Address</p>
                      <p className="text-muted-foreground mt-0.5 leading-relaxed">
                        {brand.address.line1},<br />
                        {brand.address.city} – {brand.address.pincode}, {brand.address.state}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl bg-accent text-secondary flex items-center justify-center shrink-0">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">Working Hours</p>
                      <p className="text-muted-foreground mt-0.5">
                        Monday to Saturday: 9:00 AM – 7:00 PM IST
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border space-y-3">
                  <a
                    href={whatsappLink("Hello Kayal Samayal, I would like to inquire about your products.")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full"
                  >
                    <Button variant="whatsapp" size="touch" className="w-full gap-2 font-bold shadow-md">
                      <MessageCircle className="h-4 w-4" />
                      <span>Chat on WhatsApp</span>
                    </Button>
                  </a>
                </div>
              </div>

              {/* FSSAI Registration Card */}
              <div className="rounded-2xl bg-surface border border-border p-5 text-xs text-muted-foreground space-y-2">
                <div className="flex items-center gap-2 font-bold text-primary">
                  <ShieldCheck className="h-4 w-4 text-leaf" />
                  <span>Licensed & Certified Operations</span>
                </div>
                <p><strong>FSSAI Registration No:</strong> {brand.fssai}</p>
                <p><strong>GST Identification No:</strong> {brand.gst}</p>
              </div>
            </div>

            {/* Right: Message Form */}
            <div className="lg:col-span-7 rounded-3xl border border-border/80 bg-card p-6 sm:p-10 shadow-[var(--shadow-card)] space-y-6">
              <div>
                <h2 className="font-display font-bold text-xl sm:text-2xl text-primary">
                  Send Us a Direct Message
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  We usually respond within a few hours on business days.
                </p>
              </div>

              {submitted ? (
                <div className="rounded-2xl bg-leaf/10 border border-leaf/30 p-8 text-center space-y-3">
                  <CheckCircle2 className="h-12 w-12 text-leaf mx-auto" />
                  <h3 className="font-display font-bold text-lg text-primary">Message Received!</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
                    Thank you, {form.name}. Our representative will contact you on WhatsApp / Phone ({form.phone}) shortly.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 font-bold"
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
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground">Your Name *</label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="e.g. Dineshkumar"
                        className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="10-digit mobile number"
                        className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground">Email Address</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="name@example.com"
                        className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground">Subject</label>
                      <select
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50 cursor-pointer"
                      >
                        <option value="Product Inquiry">Product Inquiry</option>
                        <option value="Order Tracking">Order Status / Tracking</option>
                        <option value="Bulk Order">Bulk / Family Function Orders</option>
                        <option value="Other">Other Question</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Your Message *</label>
                    <textarea
                      required
                      rows={4}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Tell us what you need help with..."
                      className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button type="submit" variant="plum" size="touch" className="w-full sm:w-auto font-bold px-8 shadow-md">
                      Send Message
                    </Button>
                  </div>
                </form>
              )}
            </div>

          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
}
