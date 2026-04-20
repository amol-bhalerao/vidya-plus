import React from 'react';
import { motion } from 'framer-motion';

const GallerySection = ({ gallery, title = 'Campus Gallery' }) => (
  <section className="mx-auto w-full max-w-[1600px] px-4 py-20 md:px-8">
    <h1 className="mb-8 font-serif text-5xl font-bold text-[#153f63]">{title}</h1>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {gallery.map((item) => (
        <motion.figure key={item.id || item.image_url} whileHover={{ scale: 1.02 }} className="group relative overflow-hidden rounded-2xl">
          <img src={item.image_url} alt={item.title || 'Campus gallery'} className="h-72 w-full object-cover transition duration-500 group-hover:scale-110" />
          <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">{item.title || 'Gallery Item'}</figcaption>
        </motion.figure>
      ))}
    </div>
  </section>
);

export default GallerySection;
