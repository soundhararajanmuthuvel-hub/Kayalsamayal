export const brand = {
  name: "Kayal Samayal",
  legalName: "Kayal Samayal Masala",
  tagline: "Traditional Taste. Pure Quality.",
  subtitle: "Pure · Traditional · Coastal",
  varieties: "35+ Varieties",
  phone: "9003860616",
  phoneIntl: "+919003860616",
  whatsapp: "919003860616",
  email: "kpmsamayal@gmail.com",
  fssai: "22423509000118",
  gst: "33IKWPS3211P1ZB",
  address: {
    line1: "504, TNHB Phase 1",
    city: "Tirupattur",
    state: "Tamil Nadu",
    pincode: "635601",
    country: "India",
  },
  site: "https://www.kayalsamayal.in",
  freeShippingOver: 500,
  shippingFlat: 50,
};

export const whatsappLink = (message = "Hello Kayal Samayal, I would like to place an order.") =>
  `https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(message)}`;

export const formatINR = (value: number) =>
  `₹${Math.round(value).toLocaleString("en-IN")}`;

export const discountPercent = (price: number, mrp?: number) =>
  mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
