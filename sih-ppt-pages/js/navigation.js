// Navigation between slides
document.addEventListener('keydown', (e) => {
  const body = document.body;
  const currentPage = parseInt(body.getAttribute('data-page') || '1', 10);
  const totalPages = 6;

  if (e.key === 'ArrowRight' || e.key === 'Space') {
    if (currentPage < totalPages) {
      const nextPage = currentPage + 1;
      const numStr = nextPage < 10 ? '0' + nextPage : nextPage;
      // Detect if in sih-ppt-pages or slides directory
      if (window.location.pathname.includes('page-')) {
        window.location.href = `page-${numStr}.html`;
      } else if (window.location.pathname.includes('slide-')) {
        window.location.href = `slide-${numStr}.html`;
      }
    }
  } else if (e.key === 'ArrowLeft') {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      const numStr = prevPage < 10 ? '0' + prevPage : prevPage;
      if (window.location.pathname.includes('page-')) {
        window.location.href = `page-${numStr}.html`;
      } else if (window.location.pathname.includes('slide-')) {
        window.location.href = `slide-${numStr}.html`;
      }
    }
  }
});
