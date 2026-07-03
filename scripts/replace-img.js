const fs = require('fs');

function replaceImg(file, defaultW, defaultH) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('import Image')) {
     content = 'import Image from "next/image";\n' + content;
  }
  content = content.replace(/<img(.*?)src={?(.*?)}?(.*?)alt={?(.*?)}?(.*?)className={?(.*?)}?(.*?)\/?>/g, (match, p1, src, p3, alt, p5, cls, p7) => {
     let w = defaultW;
     let h = defaultH;
     if (cls && cls.includes('w-5 h-5')) { w=20; h=20; }
     
     return `<Image src={${src}} alt={${alt}} width={${w}} height={${h}} className={${cls}} unoptimized />`;
  });
  content = content.replace(/<img(.*?)src="(.*?)"(.*?)alt="(.*?)"(.*?)className={?(.*?)}?(.*?)\/?>/g, (match, p1, src, p3, alt, p5, cls, p7) => {
     return `<Image src="${src}" alt="${alt}" width={${defaultW}} height={${defaultH}} className={${cls}} unoptimized />`;
  });
  
  fs.writeFileSync(file, content);
  console.log('Replaced in', file);
}

replaceImg('apps/web/src/components/lului/NewlyAdded.tsx', 64, 64);
replaceImg('apps/web/src/components/lului/PremiumShowcase.tsx', 64, 64);
replaceImg('apps/web/src/components/lului/TrendingHype.tsx', 64, 64);
replaceImg('apps/web/src/components/server/ServerOverview.tsx', 64, 64);
replaceImg('apps/web/src/components/shared/HeroSearch.tsx', 64, 64);
replaceImg('apps/web/src/components/user/UserBadges.tsx', 32, 32);
replaceImg('apps/web/src/app/(main)/users/[id]/client-page.tsx', 64, 64);
replaceImg('apps/web/src/app/(main)/users/client-page.tsx', 64, 64);
