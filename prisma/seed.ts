import "dotenv/config";
import { PrismaClient } from "./generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const hashedPassword = await bcrypt.hash("Password@123", 10);

  const userData = [
    {
      name: "Amit Sharma",
      email: "amit@example.com",
      password: hashedPassword,
    },
    {
      name: "Rahul Verma",
      email: "rahul@example.com",
      password: hashedPassword,
    },
    {
      name: "Priya Singh",
      email: "priya@example.com",
      password: hashedPassword,
    },
  ];

  for (const user of userData) {
  await prisma.user.upsert({
    where: {
      email: user.email,
    },
    update: {
      name: user.name,
      password: user.password,
    },
    create: {
      name: user.name,
      email: user.email,
      password: user.password,
    },
  });
}

  console.log("Users seeded successfully.");
  console.log("Starting seed...");

  const brands = [
    {
      name: "Autodesk",
      slug: "autodesk",
      description:
        "Autodesk provides software for architecture, engineering, construction, manufacturing, media and entertainment.",
      website: "https://www.autodesk.com/",
    },
    {
      name: "Dassault Systèmes",
      slug: "dassault-systemes",
      description:
        "Dassault Systèmes provides 3D design, engineering and simulation solutions.",
      website: "https://www.3ds.com/",
    },
    {
      name: "Bentley Systems",
      slug: "bentley-systems",
      description:
        "Bentley Systems develops infrastructure engineering software.",
      website: "https://www.bentley.com/",
    },
    {
      name: "Trimble",
      slug: "trimble",
      description:
        "Trimble provides technology solutions for construction, architecture, engineering and geospatial industries.",
      website: "https://www.trimble.com/",
    },
    {
      name: "Siemens",
      slug: "siemens",
      description:
        "Siemens provides industrial software and digital engineering solutions.",
      website: "https://www.siemens.com/",
    },
    {
      name: "PTC",
      slug: "ptc",
      description:
        "PTC provides product development and engineering software solutions.",
      website: "https://www.ptc.com/",
    },
  ];

  for (const brand of brands) {
    await prisma.brand.upsert({
      where: {
        slug: brand.slug,
      },
      update: brand,
      create: brand,
    });
  }

  console.log("Brands seeded successfully.");

  const categories = [
    {
      name: "CAD Software",
      slug: "cad-software",
      description:
        "Computer-aided design software for professional design workflows.",
    },
    {
      name: "General CAD",
      slug: "general-cad",
      description: "General-purpose CAD software for 2D and 3D design.",
    },
    {
      name: "Mechanical CAD",
      slug: "mechanical-cad",
      description: "CAD solutions for mechanical design and engineering.",
    },
    {
      name: "BIM Software",
      slug: "bim-software",
      description:
        "Building Information Modeling software for architecture and construction.",
    },
    {
      name: "CAM Software",
      slug: "cam-software",
      description: "Computer-aided manufacturing software.",
    },
    {
      name: "3D Design Software",
      slug: "3d-design-software",
      description: "Software for 3D modeling, visualization and design.",
    },
    {
      name: "Civil Engineering CAD",
      slug: "civil-engineering-cad",
      description:
        "CAD solutions designed for civil engineering and infrastructure.",
    },
    {
      name: "Cloud CAD/CAM",
      slug: "cloud-cad-cam",
      description: "Cloud-based CAD and CAM design solutions.",
    },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: {
        slug: category.slug,
      },
      update: category,
      create: category,
    });
  }

  console.log("Categories seeded successfully.");

  const autodesk = await prisma.brand.findUnique({
    where: { slug: "autodesk" },
  });

  const dassault = await prisma.brand.findUnique({
    where: { slug: "dassault-systemes" },
  });

  const trimble = await prisma.brand.findUnique({
    where: { slug: "trimble" },
  });

  const generalCad = await prisma.category.findUnique({
    where: { slug: "general-cad" },
  });

  const bimSoftware = await prisma.category.findUnique({
    where: { slug: "bim-software" },
  });

  const mechanicalCad = await prisma.category.findUnique({
    where: { slug: "mechanical-cad" },
  });

  const design3d = await prisma.category.findUnique({
    where: { slug: "3d-design-software" },
  });

  if (
    !autodesk ||
    !dassault ||
    !trimble ||
    !generalCad ||
    !bimSoftware ||
    !mechanicalCad ||
    !design3d
  ) {
    throw new Error("Required brand or category not found.");
  }

  const products = [
    {
      name: "AutoCAD",
      slug: "autocad",
      shortDescription:
        "Professional 2D and 3D CAD software for precise design and drafting.",
      description:
        "AutoCAD is professional design and drafting software used across architecture, engineering, construction and manufacturing.",
      website: "https://www.autodesk.com/products/autocad/",
      rating: 4.7,
      reviewCount: 1200,
      pricing: "Paid",
      freeTrial: true,
      deployment: "Desktop, Cloud",
      supportedPlatforms: "Windows, macOS",
      targetAudience: "Architects, Engineers, Designers",
      brandId: autodesk.id,
      categoryId: generalCad.id,
    },
    {
      name: "Revit",
      slug: "revit",
      shortDescription:
        "BIM software for architecture, engineering and construction.",
      description:
        "Revit is BIM software that helps architects, engineers and construction professionals design, document and manage building projects.",
      website: "https://www.autodesk.com/products/revit/",
      rating: 4.6,
      reviewCount: 850,
      pricing: "Paid",
      freeTrial: true,
      deployment: "Desktop, Cloud",
      supportedPlatforms: "Windows",
      targetAudience: "Architects, Engineers, Contractors",
      brandId: autodesk.id,
      categoryId: bimSoftware.id,
    },
    {
      name: "Fusion",
      slug: "fusion",
      shortDescription: "Cloud-based 3D CAD, CAM, CAE and PCB design software.",
      description:
        "Autodesk Fusion combines 3D CAD, CAM, CAE and PCB capabilities in a cloud-connected platform.",
      website: "https://www.autodesk.com/products/fusion-360/",
      rating: 4.5,
      reviewCount: 700,
      pricing: "Paid",
      freeTrial: true,
      deployment: "Cloud, Desktop",
      supportedPlatforms: "Windows, macOS",
      targetAudience: "Product Designers, Engineers, Manufacturers",
      brandId: autodesk.id,
      categoryId: mechanicalCad.id,
    },
    {
      name: "SOLIDWORKS",
      slug: "solidworks",
      shortDescription:
        "3D CAD software for mechanical design and product development.",
      description:
        "SOLIDWORKS provides professional 3D CAD tools for mechanical design, simulation and product development.",
      website: "https://www.solidworks.com/",
      rating: 4.6,
      reviewCount: 950,
      pricing: "Paid",
      freeTrial: false,
      deployment: "Desktop, Cloud",
      supportedPlatforms: "Windows",
      targetAudience: "Mechanical Engineers, Designers, Manufacturers",
      brandId: dassault.id,
      categoryId: mechanicalCad.id,
    },
    {
      name: "CATIA",
      slug: "catia",
      shortDescription:
        "Advanced 3D design and engineering software for product development.",
      description:
        "CATIA is an advanced engineering and product development platform used for complex 3D design and systems engineering.",
      website: "https://www.3ds.com/products/catia/",
      rating: 4.5,
      reviewCount: 620,
      pricing: "Contact Vendor",
      freeTrial: false,
      deployment: "Cloud, Desktop",
      supportedPlatforms: "Windows",
      targetAudience: "Engineers, Designers, Manufacturers",
      brandId: dassault.id,
      categoryId: mechanicalCad.id,
    },
    {
      name: "SketchUp",
      slug: "sketchup",
      shortDescription:
        "3D modeling software for architecture, construction and design.",
      description:
        "SketchUp is a 3D modeling platform used for architectural design, construction, interior design and visualization.",
      website: "https://www.sketchup.com/",
      rating: 4.4,
      reviewCount: 780,
      pricing: "Paid",
      freeTrial: true,
      deployment: "Cloud, Desktop",
      supportedPlatforms: "Windows, macOS, Web",
      targetAudience: "Architects, Designers, Construction Professionals",
      brandId: trimble.id,
      categoryId: design3d.id,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: {
        slug: product.slug,
      },
      update: product,
      create: product,
    });
  }

  console.log("Products seeded successfully.");

  const autocad = await prisma.product.findUnique({
    where: { slug: "autocad" },
  });

  const revit = await prisma.product.findUnique({
    where: { slug: "revit" },
  });

  const fusion = await prisma.product.findUnique({
    where: { slug: "fusion" },
  });

  const solidworks = await prisma.product.findUnique({
    where: { slug: "solidworks" },
  });

  const catia = await prisma.product.findUnique({
    where: { slug: "catia" },
  });

  const sketchup = await prisma.product.findUnique({
    where: { slug: "sketchup" },
  });

  if (!autocad || !revit || !fusion || !solidworks || !catia || !sketchup) {
    throw new Error("Required products not found.");
  }

  const pricingPlans = [
    {
      productId: autocad.id,
      name: "AutoCAD Subscription",
      description: "Professional CAD design and drafting.",
      price: 150000,
      billing: "year",
      currency: "INR",
      features: "2D drafting, 3D modeling, collaboration",
    },
    {
      productId: revit.id,
      name: "Revit Subscription",
      description: "BIM software for architecture and construction.",
      price: 180000,
      billing: "year",
      currency: "INR",
      features: "BIM design, documentation, collaboration",
    },
    {
      productId: fusion.id,
      name: "Fusion Subscription",
      description: "Cloud-connected CAD, CAM and CAE.",
      price: 85000,
      billing: "year",
      currency: "INR",
      features: "3D CAD, CAM, simulation, collaboration",
    },
    {
      productId: solidworks.id,
      name: "SOLIDWORKS Professional",
      description: "Professional mechanical design solution.",
      price: 200000,
      billing: "year",
      currency: "INR",
      features: "3D CAD, assemblies, drawings, simulation",
    },
    {
      productId: catia.id,
      name: "CATIA",
      description: "Advanced engineering and product development.",
      price: 300000,
      billing: "year",
      currency: "INR",
      features: "3D design, systems engineering, simulation",
    },
    {
      productId: sketchup.id,
      name: "SketchUp Pro",
      description: "Professional 3D modeling and visualization.",
      price: 60000,
      billing: "year",
      currency: "INR",
      features: "3D modeling, visualization, documentation",
    },
  ];

  for (const plan of pricingPlans) {
    const existingPlan = await prisma.pricingPlan.findFirst({
      where: {
        productId: plan.productId,
        name: plan.name,
      },
    });

    if (existingPlan) {
      await prisma.pricingPlan.update({
        where: {
          id: existingPlan.id,
        },
        data: plan,
      });
    } else {
      await prisma.pricingPlan.create({
        data: plan,
      });
    }
  }

  console.log("Pricing plans seeded successfully.");

  const featureData = [
    {
      name: "2D Drafting",
      description: "Create accurate 2D technical drawings.",
    },
    {
      name: "3D Modeling",
      description: "Create and edit 3D models.",
    },
    {
      name: "Cloud Collaboration",
      description: "Collaborate with teams using cloud-based tools.",
    },
    {
      name: "BIM Design",
      description: "Building Information Modeling capabilities.",
    },
    {
      name: "Simulation",
      description: "Analyze and simulate designs.",
    },
    {
      name: "Parametric Design",
      description: "Create designs using parametric modeling.",
    },
    {
      name: "CAM",
      description: "Computer-aided manufacturing capabilities.",
    },
    {
      name: "Visualization",
      description: "Create realistic design visualizations.",
    },
  ];

  const features = [];

  for (const feature of featureData) {
    const savedFeature = await prisma.feature.upsert({
      where: {
        name: feature.name,
      },
      update: feature,
      create: feature,
    });

    features.push(savedFeature);
  }

  console.log("Features seeded successfully.");

  const featureMap = new Map<string, number>(
    features.map((feature) => [feature.name, feature.id]),
  );

  const productFeatureData = [
    {
      productSlug: "autocad",
      featureNames: [
        "2D Drafting",
        "3D Modeling",
        "Parametric Design",
        "Cloud Collaboration",
      ],
    },
    {
      productSlug: "revit",
      featureNames: ["BIM Design", "3D Modeling", "Cloud Collaboration"],
    },
    {
      productSlug: "fusion",
      featureNames: ["3D Modeling", "CAM", "Simulation", "Cloud Collaboration"],
    },
    {
      productSlug: "solidworks",
      featureNames: ["3D Modeling", "Parametric Design", "Simulation"],
    },
    {
      productSlug: "catia",
      featureNames: ["3D Modeling", "Parametric Design", "Simulation"],
    },
    {
      productSlug: "sketchup",
      featureNames: ["3D Modeling", "Visualization"],
    },
  ];

  for (const item of productFeatureData) {
    const product = await prisma.product.findUnique({
      where: {
        slug: item.productSlug,
      },
    });

    if (!product) {
      throw new Error(`Product not found: ${item.productSlug}`);
    }

    for (const featureName of item.featureNames) {
      const featureId = featureMap.get(featureName);

      if (!featureId) {
        throw new Error(`Feature not found: ${featureName}`);
      }

      await prisma.productFeature.upsert({
        where: {
          productId_featureId: {
            productId: product.id,
            featureId,
          },
        },
        update: {},
        create: {
          productId: product.id,
          featureId,
        },
      });
    }
  }

  console.log("Product features connected successfully.");

  const specificationData = [
    {
      name: "Operating System",
      values: {
        autocad: "Windows, macOS",
        revit: "Windows",
        fusion: "Windows, macOS",
        solidworks: "Windows",
        catia: "Windows",
        sketchup: "Windows, macOS",
      },
    },
    {
      name: "Deployment",
      values: {
        autocad: "Desktop, Cloud",
        revit: "Desktop, Cloud",
        fusion: "Desktop, Cloud",
        solidworks: "Desktop",
        catia: "Desktop",
        sketchup: "Desktop, Cloud",
      },
    },
    {
      name: "2D Design",
      values: {
        autocad: "Yes",
        revit: "Yes",
        fusion: "Yes",
        solidworks: "Yes",
        catia: "Yes",
        sketchup: "Yes",
      },
    },
    {
      name: "3D Modeling",
      values: {
        autocad: "Yes",
        revit: "Yes",
        fusion: "Yes",
        solidworks: "Yes",
        catia: "Yes",
        sketchup: "Yes",
      },
    },
    {
      name: "Free Trial",
      values: {
        autocad: "Yes",
        revit: "Yes",
        fusion: "Yes",
        solidworks: "No",
        catia: "No",
        sketchup: "Yes",
      },
    },
  ];

  for (const specification of specificationData) {
    const savedSpecification = await prisma.specification.upsert({
      where: {
        name: specification.name,
      },
      update: {},
      create: {
        name: specification.name,
      },
    });

    for (const [productSlug, value] of Object.entries(specification.values)) {
      const product = await prisma.product.findUnique({
        where: {
          slug: productSlug,
        },
      });

      if (!product) {
        throw new Error(`Product not found: ${productSlug}`);
      }

      await prisma.productSpecification.upsert({
        where: {
          productId_specificationId: {
            productId: product.id,
            specificationId: savedSpecification.id,
          },
        },
        update: {
          value,
        },
        create: {
          value,
          productId: product.id,
          specificationId: savedSpecification.id,
        },
      });
    }
  }

  console.log("Product specifications seeded successfully.");

  const productImageData = [
    {
      productSlug: "autocad",
      images: [
        {
          url: "https://placehold.co/1200x800?text=AutoCAD",
          altText: "AutoCAD software",
          type: "main",
          sortOrder: 0,
        },
        {
          url: "https://placehold.co/1200x800?text=AutoCAD+Gallery",
          altText: "AutoCAD interface",
          type: "gallery",
          sortOrder: 1,
        },
      ],
    },
    {
      productSlug: "revit",
      images: [
        {
          url: "https://placehold.co/1200x800?text=Revit",
          altText: "Revit software",
          type: "main",
          sortOrder: 0,
        },
        {
          url: "https://placehold.co/1200x800?text=Revit+Gallery",
          altText: "Revit interface",
          type: "gallery",
          sortOrder: 1,
        },
      ],
    },
    {
      productSlug: "fusion",
      images: [
        {
          url: "https://placehold.co/1200x800?text=Fusion",
          altText: "Fusion software",
          type: "main",
          sortOrder: 0,
        },
        {
          url: "https://placehold.co/1200x800?text=Fusion+Gallery",
          altText: "Fusion interface",
          type: "gallery",
          sortOrder: 1,
        },
      ],
    },
    {
      productSlug: "solidworks",
      images: [
        {
          url: "https://placehold.co/1200x800?text=SOLIDWORKS",
          altText: "SOLIDWORKS software",
          type: "main",
          sortOrder: 0,
        },
        {
          url: "https://placehold.co/1200x800?text=SOLIDWORKS+Gallery",
          altText: "SOLIDWORKS interface",
          type: "gallery",
          sortOrder: 1,
        },
      ],
    },
    {
      productSlug: "catia",
      images: [
        {
          url: "https://placehold.co/1200x800?text=CATIA",
          altText: "CATIA software",
          type: "main",
          sortOrder: 0,
        },
        {
          url: "https://placehold.co/1200x800?text=CATIA+Gallery",
          altText: "CATIA interface",
          type: "gallery",
          sortOrder: 1,
        },
      ],
    },
    {
      productSlug: "sketchup",
      images: [
        {
          url: "https://placehold.co/1200x800?text=SketchUp",
          altText: "SketchUp software",
          type: "main",
          sortOrder: 0,
        },
        {
          url: "https://placehold.co/1200x800?text=SketchUp+Gallery",
          altText: "SketchUp interface",
          type: "gallery",
          sortOrder: 1,
        },
      ],
    },
  ];

  for (const item of productImageData) {
    const product = await prisma.product.findUnique({
      where: {
        slug: item.productSlug,
      },
    });

    if (!product) {
      throw new Error(`Product not found: ${item.productSlug}`);
    }

    for (const image of item.images) {
      const existingImage = await prisma.productImage.findFirst({
        where: {
          productId: product.id,
          sortOrder: image.sortOrder,
        },
      });

      if (existingImage) {
        await prisma.productImage.update({
          where: {
            id: existingImage.id,
          },
          data: image,
        });
      } else {
        await prisma.productImage.create({
          data: {
            ...image,
            productId: product.id,
          },
        });
      }
    }
  }

  console.log("Product images seeded successfully.");

  const alternativeData = [
    {
      productSlug: "autocad",
      alternativeSlugs: ["revit", "fusion", "sketchup"],
    },
    {
      productSlug: "revit",
      alternativeSlugs: ["autocad", "fusion"],
    },
    {
      productSlug: "fusion",
      alternativeSlugs: ["solidworks", "autocad"],
    },
    {
      productSlug: "solidworks",
      alternativeSlugs: ["fusion", "catia"],
    },
    {
      productSlug: "catia",
      alternativeSlugs: ["solidworks", "fusion"],
    },
    {
      productSlug: "sketchup",
      alternativeSlugs: ["autocad", "revit"],
    },
  ];

  for (const item of alternativeData) {
    const product = await prisma.product.findUnique({
      where: {
        slug: item.productSlug,
      },
    });

    if (!product) {
      throw new Error(`Product not found: ${item.productSlug}`);
    }

    for (const alternativeSlug of item.alternativeSlugs) {
      const alternative = await prisma.product.findUnique({
        where: {
          slug: alternativeSlug,
        },
      });

      if (!alternative) {
        throw new Error(`Alternative product not found: ${alternativeSlug}`);
      }

      if (product.id === alternative.id) {
        continue;
      }

      await prisma.productAlternative.upsert({
        where: {
          productId_alternativeId: {
            productId: product.id,
            alternativeId: alternative.id,
          },
        },
        update: {},
        create: {
          productId: product.id,
          alternativeId: alternative.id,
        },
      });
    }
  }

  console.log("Product alternatives seeded successfully.");

  const faqData = [
    {
      productSlug: "autocad",
      faqs: [
        {
          question: "What is AutoCAD?",
          answer:
            "AutoCAD is computer-aided design software used to create precise 2D drawings and 3D models.",
          sortOrder: 0,
        },
        {
          question: "Does AutoCAD offer a free trial?",
          answer:
            "Yes, AutoCAD is available with a free trial for eligible users.",
          sortOrder: 1,
        },
        {
          question: "Which operating systems does AutoCAD support?",
          answer: "AutoCAD supports Windows and macOS.",
          sortOrder: 2,
        },
      ],
    },
    {
      productSlug: "revit",
      faqs: [
        {
          question: "What is Revit used for?",
          answer:
            "Revit is BIM software used by architects, engineers, and construction professionals to design and manage building projects.",
          sortOrder: 0,
        },
        {
          question: "Does Revit support BIM?",
          answer: "Yes, BIM is one of the core capabilities of Revit.",
          sortOrder: 1,
        },
        {
          question: "Is Revit available for macOS?",
          answer: "Revit is primarily designed for Windows.",
          sortOrder: 2,
        },
      ],
    },
    {
      productSlug: "fusion",
      faqs: [
        {
          question: "What is Fusion?",
          answer:
            "Fusion is a cloud-connected platform combining 3D design, engineering, simulation, and manufacturing capabilities.",
          sortOrder: 0,
        },
        {
          question: "Does Fusion support CAM?",
          answer:
            "Yes, Fusion includes computer-aided manufacturing capabilities.",
          sortOrder: 1,
        },
        {
          question: "Does Fusion support simulation?",
          answer:
            "Yes, Fusion provides simulation capabilities for design and engineering workflows.",
          sortOrder: 2,
        },
      ],
    },
    {
      productSlug: "solidworks",
      faqs: [
        {
          question: "What is SOLIDWORKS used for?",
          answer:
            "SOLIDWORKS is 3D CAD software widely used for mechanical design, engineering, and product development.",
          sortOrder: 0,
        },
        {
          question: "Does SOLIDWORKS support simulation?",
          answer: "Yes, SOLIDWORKS provides simulation capabilities.",
          sortOrder: 1,
        },
      ],
    },
    {
      productSlug: "catia",
      faqs: [
        {
          question: "What is CATIA used for?",
          answer:
            "CATIA is 3D design and engineering software used for complex product development and engineering workflows.",
          sortOrder: 0,
        },
        {
          question: "Does CATIA support parametric design?",
          answer:
            "Yes, CATIA supports parametric and advanced 3D modeling workflows.",
          sortOrder: 1,
        },
      ],
    },
    {
      productSlug: "sketchup",
      faqs: [
        {
          question: "What is SketchUp used for?",
          answer:
            "SketchUp is 3D modeling software commonly used for architecture, interior design, construction, and visualization.",
          sortOrder: 0,
        },
        {
          question: "Does SketchUp support 3D modeling?",
          answer: "Yes, 3D modeling is one of SketchUp's primary capabilities.",
          sortOrder: 1,
        },
      ],
    },
  ];

  for (const item of faqData) {
    const product = await prisma.product.findUnique({
      where: {
        slug: item.productSlug,
      },
    });

    if (!product) {
      throw new Error(`Product not found: ${item.productSlug}`);
    }

    for (const faq of item.faqs) {
      const existingFaq = await prisma.fAQ.findFirst({
        where: {
          productId: product.id,
          question: faq.question,
        },
      });

      if (existingFaq) {
        await prisma.fAQ.update({
          where: {
            id: existingFaq.id,
          },
          data: {
            answer: faq.answer,
            sortOrder: faq.sortOrder,
          },
        });
      } else {
        await prisma.fAQ.create({
          data: {
            question: faq.question,
            answer: faq.answer,
            sortOrder: faq.sortOrder,
            productId: product.id,
          },
        });
      }
    }
  }

  console.log("Product FAQs seeded successfully.");

  const questionData = [
    {
      productSlug: "autocad",
      userEmail: "amit@example.com",
      question: "Is AutoCAD suitable for beginners?",
    },
    {
      productSlug: "autocad",
      userEmail: "rahul@example.com",
      question: "Does AutoCAD support 3D modeling?",
    },
    {
      productSlug: "revit",
      userEmail: "priya@example.com",
      question: "Is Revit useful for architectural design?",
    },
    {
      productSlug: "fusion",
      userEmail: "amit@example.com",
      question: "Does Fusion include CAM capabilities?",
    },
    {
      productSlug: "solidworks",
      userEmail: "rahul@example.com",
      question: "Is SOLIDWORKS suitable for mechanical design?",
    },
    {
      productSlug: "sketchup",
      userEmail: "priya@example.com",
      question: "Can SketchUp be used for interior design?",
    },
  ];

  const questions = [];

  for (const item of questionData) {
    const product = await prisma.product.findUnique({
      where: {
        slug: item.productSlug,
      },
    });

    if (!product) {
      throw new Error(`Product not found: ${item.productSlug}`);
    }

    const user = await prisma.user.findUnique({
      where: {
        email: item.userEmail,
      },
    });

    if (!user) {
      throw new Error(`User not found: ${item.userEmail}`);
    }

    const existingQuestion = await prisma.productQuestion.findFirst({
      where: {
        productId: product.id,
        userId: user.id,
        question: item.question,
      },
    });

    if (existingQuestion) {
      questions.push(existingQuestion);
    } else {
      const savedQuestion = await prisma.productQuestion.create({
        data: {
          question: item.question,
          productId: product.id,
          userId: user.id,
        },
      });

      questions.push(savedQuestion);
    }
  }

  console.log("Product questions seeded successfully.");

  const answerData = [
    {
      productSlug: "autocad",
      question: "Is AutoCAD suitable for beginners?",
      userEmail: "rahul@example.com",
      answer:
        "Yes. AutoCAD can be learned by beginners through structured tutorials and regular practice.",
    },
    {
      productSlug: "autocad",
      question: "Does AutoCAD support 3D modeling?",
      userEmail: "priya@example.com",
      answer:
        "Yes. AutoCAD supports both 2D drafting and 3D modeling workflows.",
    },
    {
      productSlug: "revit",
      question: "Is Revit useful for architectural design?",
      userEmail: "amit@example.com",
      answer:
        "Yes. Revit is widely used for building design and BIM-based architectural workflows.",
    },
    {
      productSlug: "fusion",
      question: "Does Fusion include CAM capabilities?",
      userEmail: "rahul@example.com",
      answer:
        "Yes. Fusion includes CAM capabilities for manufacturing workflows.",
    },
    {
      productSlug: "solidworks",
      question: "Is SOLIDWORKS suitable for mechanical design?",
      userEmail: "priya@example.com",
      answer:
        "Yes. SOLIDWORKS is designed for 3D mechanical design and engineering workflows.",
    },
    {
      productSlug: "sketchup",
      question: "Can SketchUp be used for interior design?",
      userEmail: "amit@example.com",
      answer:
        "Yes. SketchUp is commonly used for interior design, architectural visualization, and 3D modeling.",
    },
  ];

  for (const item of answerData) {
    const product = await prisma.product.findUnique({
      where: {
        slug: item.productSlug,
      },
    });

    if (!product) {
      throw new Error(`Product not found: ${item.productSlug}`);
    }

    const question = await prisma.productQuestion.findFirst({
      where: {
        productId: product.id,
        question: item.question,
      },
    });

    if (!question) {
      throw new Error(`Question not found: ${item.question}`);
    }

    const user = await prisma.user.findUnique({
      where: {
        email: item.userEmail,
      },
    });

    if (!user) {
      throw new Error(`User not found: ${item.userEmail}`);
    }

    const existingAnswer = await prisma.productAnswer.findFirst({
      where: {
        questionId: question.id,
        userId: user.id,
        answer: item.answer,
      },
    });

    if (!existingAnswer) {
      await prisma.productAnswer.create({
        data: {
          answer: item.answer,
          questionId: question.id,
          userId: user.id,
        },
      });
    }
  }

  console.log("Product answers seeded successfully.");

  const reviewData = [
    {
      productSlug: "autocad",
      userEmail: "amit@example.com",
      rating: 5,
      title: "Excellent CAD software",
      comment:
        "AutoCAD provides a powerful set of tools for drafting and 3D design.",
    },
    {
      productSlug: "autocad",
      userEmail: "rahul@example.com",
      rating: 4,
      title: "Reliable design tool",
      comment:
        "A reliable option for professional drafting and engineering workflows.",
    },
    {
      productSlug: "revit",
      userEmail: "priya@example.com",
      rating: 5,
      title: "Great for BIM",
      comment:
        "Revit provides a strong workflow for architectural and BIM projects.",
    },
    {
      productSlug: "fusion",
      userEmail: "amit@example.com",
      rating: 5,
      title: "Good all-in-one platform",
      comment:
        "The combination of modeling, simulation, and manufacturing tools is useful.",
    },
    {
      productSlug: "solidworks",
      userEmail: "rahul@example.com",
      rating: 5,
      title: "Powerful mechanical design",
      comment:
        "SOLIDWORKS is a strong choice for detailed mechanical design workflows.",
    },
    {
      productSlug: "catia",
      userEmail: "priya@example.com",
      rating: 4,
      title: "Advanced engineering capabilities",
      comment:
        "CATIA offers powerful tools for complex engineering and product development.",
    },
    {
      productSlug: "sketchup",
      userEmail: "amit@example.com",
      rating: 4,
      title: "Easy to learn",
      comment:
        "SketchUp is intuitive and useful for quickly creating 3D concepts.",
    },
  ];

  for (const item of reviewData) {
    const product = await prisma.product.findUnique({
      where: {
        slug: item.productSlug,
      },
    });

    if (!product) {
      throw new Error(`Product not found: ${item.productSlug}`);
    }

    const user = await prisma.user.findUnique({
      where: {
        email: item.userEmail,
      },
    });

    if (!user) {
      throw new Error(`User not found: ${item.userEmail}`);
    }

    const existingReview = await prisma.review.findFirst({
      where: {
        productId: product.id,
        userId: user.id,
        title: item.title,
      },
    });

    if (!existingReview) {
      await prisma.review.create({
        data: {
          rating: item.rating,
          title: item.title,
          comment: item.comment,
          productId: product.id,
          userId: user.id,
        },
      });
    }
  }

  console.log("Product reviews seeded successfully.");

  const blogData = [
    {
      title: "How to Choose the Right CAD Software for Your Business",
      slug: "how-to-choose-right-cad-software",
      excerpt:
        "A practical guide to choosing CAD software based on your design requirements, team size, workflow, and budget.",
      content:
        "Choosing the right CAD software depends on your business requirements, design workflows, team size, and budget. Start by identifying whether you need 2D drafting, 3D modeling, BIM, simulation, or manufacturing capabilities. You should also consider operating system support, deployment options, collaboration features, learning curve, and available support.",
      featuredImage: "https://placehold.co/1200x630?text=CAD+Software+Guide",
      published: true,
      publishedAt: new Date(),
      authorEmail: "amit@example.com",
    },
    {
      title: "AutoCAD vs Revit: Which Software Should You Choose?",
      slug: "autocad-vs-revit",
      excerpt:
        "Understand the key differences between AutoCAD and Revit and when each solution is better suited for your workflow.",
      content:
        "AutoCAD and Revit serve different design requirements. AutoCAD is widely used for 2D drafting and general CAD workflows, while Revit focuses heavily on building information modeling and architectural workflows. Your choice should depend on the type of projects you manage and the level of BIM functionality you require.",
      featuredImage: "https://placehold.co/1200x630?text=AutoCAD+vs+Revit",
      published: true,
      publishedAt: new Date(),
      authorEmail: "rahul@example.com",
    },
    {
      title: "Top Features to Look for in 3D Design Software",
      slug: "top-features-3d-design-software",
      excerpt:
        "Explore the important features to consider when evaluating 3D modeling and design software.",
      content:
        "Modern 3D design software can provide modeling, visualization, simulation, collaboration, and manufacturing capabilities. When comparing products, look at modeling tools, rendering capabilities, supported file formats, collaboration features, performance, deployment options, and integration with other software.",
      featuredImage: "https://placehold.co/1200x630?text=3D+Design+Software",
      published: true,
      publishedAt: new Date(),
      authorEmail: "priya@example.com",
    },
  ];

  for (const post of blogData) {
    const author = await prisma.user.findUnique({
      where: {
        email: post.authorEmail,
      },
    });

    if (!author) {
      throw new Error(`Author not found: ${post.authorEmail}`);
    }

    await prisma.blogPost.upsert({
      where: {
        slug: post.slug,
      },
      update: {
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        featuredImage: post.featuredImage,
        published: post.published,
        publishedAt: post.publishedAt,
        authorId: author.id,
      },
      create: {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        featuredImage: post.featuredImage,
        published: post.published,
        publishedAt: post.publishedAt,
        authorId: author.id,
      },
    });
  }

  console.log("Blog posts seeded successfully.");

  // Website Builder permissions (idempotent).
  // Preserve existing roles, role assignments, and other permissions.
  const websiteBuilderActions = [
    "view",
    "create",
    "edit",
    "delete",
    "publish",
    "assets_manage",
  ] as const;

  const websiteBuilderPermissions = [];

  for (const action of websiteBuilderActions) {
    const permission = await prisma.permission.upsert({
      where: { key: `website_builder.${action}` },
      update: {},
      create: {
        module: "website_builder",
        action,
        key: `website_builder.${action}`,
      },
    });
    websiteBuilderPermissions.push(permission);
  }

  // Never create or promote an admin role implicitly from a seed.
  // The existing system role must be present before assigning permissions.
  const superAdminRole = await prisma.role.findUnique({
    where: { name: "Super Admin" },
    select: { id: true, isSystem: true },
  });

  if (!superAdminRole || !superAdminRole.isSystem) {
    throw new Error(
      'Website Builder permissions were registered, but the system role "Super Admin" was not found. Verify the role name and isSystem flag before assigning permissions.',
    );
  }

  for (const permission of websiteBuilderPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: permission.id,
      },
    });
  }

  console.log("Website Builder permissions assigned to Super Admin.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
