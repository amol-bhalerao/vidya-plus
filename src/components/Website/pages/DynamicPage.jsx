import React from 'react';

const HeroBlock = ({ data }) => (
  <section className="overflow-hidden rounded-3xl border border-[#c9dff4] bg-[#0d4d73] px-6 py-14 text-white md:px-12">
    <h2 className="font-serif text-4xl font-bold md:text-5xl">{data?.title || 'Hero Title'}</h2>
    <p className="mt-4 max-w-3xl text-lg text-[#d2e8fb]">{data?.subtitle || 'Hero subtitle text.'}</p>
    {data?.ctaText && (
      <a href={data?.ctaLink || '/contact'} className="mt-6 inline-flex rounded-full bg-white px-6 py-3 font-semibold text-[#0d4d73] transition hover:scale-[1.02]">
        {data.ctaText}
      </a>
    )}
  </section>
);

const CardsBlock = ({ data }) => (
  <section className="space-y-5">
    <h2 className="font-serif text-3xl font-bold text-[#153f63]">{data?.sectionTitle || 'Cards'}</h2>
    <div className="grid gap-4 md:grid-cols-3">
      {(Array.isArray(data?.items) ? data.items : []).map((item, index) => (
        <article key={`${item?.title || 'card'}-${index}`} className="rounded-2xl border border-[#d8e8f7] bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-[#153f63]">{item?.title || 'Card title'}</h3>
          <p className="mt-2 text-sm text-[#4a6f92]">{item?.text || 'Card content.'}</p>
        </article>
      ))}
    </div>
  </section>
);

const StatsBlock = ({ data }) => (
  <section className="space-y-5">
    <h2 className="font-serif text-3xl font-bold text-[#153f63]">{data?.sectionTitle || 'Stats'}</h2>
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
      {(Array.isArray(data?.items) ? data.items : []).map((item, index) => (
        <article key={`${item?.label || 'stat'}-${index}`} className="rounded-2xl bg-[#eaf3fc] p-5 text-center">
          <p className="text-3xl font-bold text-[#115382]">{item?.value || '0'}{item?.suffix || ''}</p>
          <p className="mt-1 text-sm text-[#406589]">{item?.label || 'Metric'}</p>
        </article>
      ))}
    </div>
  </section>
);

const GalleryBlock = ({ data }) => (
  <section className="space-y-5">
    <h2 className="font-serif text-3xl font-bold text-[#153f63]">{data?.sectionTitle || 'Gallery'}</h2>
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
      {(Array.isArray(data?.images) ? data.images : []).map((image, index) => (
        <figure key={`${image?.url || 'image'}-${index}`} className="overflow-hidden rounded-2xl border border-[#d8e8f7] bg-white">
          <img src={image?.url} alt={image?.caption || 'Gallery image'} className="h-48 w-full object-cover" loading="lazy" />
          {image?.caption && <figcaption className="p-3 text-sm text-[#4a6f92]">{image.caption}</figcaption>}
        </figure>
      ))}
    </div>
  </section>
);

const renderBlock = (block, index) => {
  if (!block || typeof block !== 'object') {
    return null;
  }

  if (block.type === 'hero') {
    return <HeroBlock key={block.id || `hero-${index}`} data={block.data || {}} />;
  }
  if (block.type === 'cards') {
    return <CardsBlock key={block.id || `cards-${index}`} data={block.data || {}} />;
  }
  if (block.type === 'stats') {
    return <StatsBlock key={block.id || `stats-${index}`} data={block.data || {}} />;
  }
  if (block.type === 'gallery') {
    return <GalleryBlock key={block.id || `gallery-${index}`} data={block.data || {}} />;
  }

  return null;
};

const DynamicPage = ({ content }) => {
  const blocks = Array.isArray(content?.blocks) ? content.blocks : [];

  return (
    <section className="mx-auto w-full max-w-[1200px] space-y-10 px-4 py-20 md:px-8">
      <header>
        <h1 className="font-serif text-5xl font-bold text-[#153f63]">{content?.title || 'Page'}</h1>
        <p className="mt-6 text-lg leading-8 text-[#496c8f]">{content?.text || 'Content coming soon.'}</p>
      </header>
      {blocks.map((block, index) => renderBlock(block, index))}
    </section>
  );
};

export default DynamicPage;
