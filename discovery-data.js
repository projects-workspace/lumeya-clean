(function (root) {
  'use strict';

  var data = {
  "version": "1.0.0",
  "categories": [
    {
      "id": "body-and-movement",
      "label": "Body and movement",
      "description": "Bodywork, rehabilitation, massage and movement services, described in each provider’s own context.",
      "topicIds": [
        "bodywork",
        "rehabilitation"
      ]
    },
    {
      "id": "holistic-wellbeing",
      "label": "Holistic wellbeing",
      "description": "Wellness, sensory and reflective approaches. Individual service details remain specific to each provider.",
      "topicIds": [
        "wellness",
        "aromatherapy",
        "mind-body",
        "lila"
      ]
    },
    {
      "id": "relationships-and-growth",
      "label": "Relationships and personal growth",
      "description": "Relationship-oriented, reflective and personal-development services and formats.",
      "topicIds": [
        "relationships",
        "personal-development"
      ]
    },
    {
      "id": "nature-and-craft",
      "label": "Nature-oriented living and craft",
      "description": "Aligned ecological services, natural materials, practical work, installation and craft.",
      "topicIds": [
        "nature-oriented-living",
        "ecological-services",
        "natural-materials",
        "craft-and-making"
      ]
    },
    {
      "id": "community-and-creative-work",
      "label": "Community and creative work",
      "description": "Community activities, media and practical professional support connected with Lumeya’s wider network.",
      "topicIds": [
        "media",
        "business",
        "community"
      ]
    }
  ],
  "topics": [
    {
      "id": "bodywork",
      "label": "Bodywork",
      "description": "Body-oriented practices, including massage and hands-on work where described.",
      "categoryId": "body-and-movement"
    },
    {
      "id": "rehabilitation",
      "label": "Rehabilitation",
      "description": "Services and approaches described as rehabilitation-related.",
      "categoryId": "body-and-movement"
    },
    {
      "id": "wellness",
      "label": "Wellness",
      "description": "Wellness services and programmes as described by their providers.",
      "categoryId": "holistic-wellbeing"
    },
    {
      "id": "aromatherapy",
      "label": "Aromatherapy",
      "description": "Services that include aromatherapy.",
      "categoryId": "holistic-wellbeing"
    },
    {
      "id": "mind-body",
      "label": "Mind-body practice",
      "description": "Practices that connect bodily experience and reflection.",
      "categoryId": "holistic-wellbeing"
    },
    {
      "id": "lila",
      "label": "Lila",
      "description": "Lila and related reflective approaches.",
      "categoryId": "holistic-wellbeing"
    },
    {
      "id": "relationships",
      "label": "Relationships",
      "description": "Practices and formats focused on relationships.",
      "categoryId": "relationships-and-growth"
    },
    {
      "id": "personal-development",
      "label": "Personal development",
      "description": "Guided personal-development and purpose work.",
      "categoryId": "relationships-and-growth"
    },
    {
      "id": "media",
      "label": "Media production",
      "description": "Media, interview and related production services.",
      "categoryId": "community-and-creative-work"
    },
    {
      "id": "business",
      "label": "Business and automation",
      "description": "Ethical business, project support, marketing and automation.",
      "categoryId": "community-and-creative-work"
    },
    {
      "id": "community",
      "label": "Community",
      "description": "Community activities, gatherings and cooperation.",
      "categoryId": "community-and-creative-work"
    },
    {
      "id": "nature-oriented-living",
      "label": "Nature-oriented living",
      "description": "Services related to a nature-oriented way of living.",
      "categoryId": "nature-and-craft"
    },
    {
      "id": "ecological-services",
      "label": "Ecological services",
      "description": "Ecological services and aligned practical work, such as installation or fitting.",
      "categoryId": "nature-and-craft"
    },
    {
      "id": "natural-materials",
      "label": "Natural materials",
      "description": "Services involving natural materials and related systems.",
      "categoryId": "nature-and-craft"
    },
    {
      "id": "craft-and-making",
      "label": "Craft and making",
      "description": "Craft and making when the provider’s approach aligns with Lumeya’s nature-oriented scope.",
      "categoryId": "nature-and-craft"
    }
  ],
  "services": [
    {
      "id": "deep-massage",
      "slug": "deep-massage",
      "title": "Deep Massage & Tea Ceremony",
      "description": "A bodywork session with Ivan followed by a quiet tea ceremony.",
      "status": "By request",
      "duration": "Massage duration is not published; the tea ceremony is 30–60 minutes",
      "format": "Individual",
      "delivery": "In person",
      "location": "Santiago Studio, Prague",
      "price": "1200 CZK · approximately 48–50 EUR",
      "topicIds": [
        "bodywork",
        "rehabilitation"
      ],
      "practitionerIds": [
        "ivan-protinak"
      ],
      "placeIds": [
        "santiago-studio-praha"
      ],
      "eventFormatIds": [],
      "provider": "Ivan Protinyak",
      "detailUrl": "offer.html",
      "contactUrl": "suggest.html?topic=Deep%20Massage%20%26%20Tea%20Ceremony&details=I%20would%20like%20to%20ask%20about%20the%20Deep%20Massage%20%26%20Tea%20Ceremony%20with%20Ivan%20Protinyak%20at%20Santiago%20Studio%20in%20Prague.&city=Prague&preference=in_person#looking-for",
      "contactLabel": "Request this service",
      "providerIds": [
        "ivan-protinak"
      ]
    },
    {
      "id": "wellness-programmes",
      "slug": "wellness-programmes",
      "title": "Wellness Programs & SPA Retreats",
      "description": "Wellness programmes combining body practices, aromatherapy and SPA retreat formats.",
      "status": "By request",
      "duration": "Varies by programme",
      "format": "Individual or group",
      "delivery": "In person; selected group formats can be online",
      "location": "Czech Republic or online, depending on the format",
      "price": "Pricing on request",
      "topicIds": [
        "wellness",
        "bodywork",
        "aromatherapy"
      ],
      "practitionerIds": [
        "katerina"
      ],
      "placeIds": [
        "santiago-studio-praha"
      ],
      "eventFormatIds": [],
      "provider": "Katerina",
      "detailUrl": "offer-katerina.html",
      "contactUrl": "https://t.me/santioago_bot",
      "contactLabel": "Ask on Telegram",
      "providerIds": [
        "katerina"
      ]
    },
    {
      "id": "lila-reading",
      "slug": "lila-reading",
      "title": "Lila and Therapeutic Path Reading",
      "description": "An individual Lila-based reflective session with Violetta Blago.",
      "status": "By request",
      "duration": "Not published",
      "format": "Individual",
      "delivery": "By arrangement",
      "location": "Europe / by arrangement",
      "price": "Pricing on request",
      "topicIds": [
        "lila",
        "mind-body",
        "personal-development"
      ],
      "practitionerIds": [
        "violetta-blago"
      ],
      "placeIds": [],
      "eventFormatIds": [],
      "provider": "Violetta Blago",
      "detailUrl": "profile-violetta.html",
      "contactUrl": "https://t.me/violettablago",
      "contactLabel": "Contact Violetta on Telegram",
      "providerIds": [
        "violetta-blago"
      ],
      "sourceUrls": [
        "profile-violetta.html"
      ],
      "sourceNote": "Supported by the existing provider profile and its published @violettablago contact. Current availability, identity and qualifications have not been independently checked."
    },
    {
      "id": "universal-therapy-constellations",
      "slug": "universal-therapy-constellations",
      "title": "Universal Therapy and Constellations",
      "description": "An individual therapeutic and constellation-based practice with Violetta Blago.",
      "status": "By request",
      "duration": "Not published",
      "format": "Individual",
      "delivery": "By arrangement",
      "location": "Europe / by arrangement",
      "price": "Pricing on request",
      "topicIds": [
        "mind-body",
        "personal-development"
      ],
      "practitionerIds": [
        "violetta-blago"
      ],
      "placeIds": [],
      "eventFormatIds": [],
      "provider": "Violetta Blago",
      "detailUrl": "profile-violetta.html",
      "contactUrl": "https://t.me/violettablago",
      "contactLabel": "Contact Violetta on Telegram",
      "providerIds": [
        "violetta-blago"
      ]
    },
    {
      "id": "purpose-brand-discovery",
      "slug": "purpose-brand-discovery",
      "title": "Personal Brand and Purpose Discovery",
      "description": "A guided discovery process for clarifying purpose, positioning and a personal brand direction.",
      "status": "By request",
      "duration": "Not published",
      "format": "Individual",
      "delivery": "By arrangement",
      "location": "Prague / by arrangement",
      "price": "Pricing on request",
      "topicIds": [
        "personal-development",
        "business"
      ],
      "practitionerIds": [
        "andrij-pycha"
      ],
      "placeIds": [],
      "eventFormatIds": [],
      "provider": "Ethical Marketing & Automation Agency",
      "detailUrl": "ethical-automation-agency.html",
      "contactUrl": "https://t.me/santioago_bot",
      "contactLabel": "Ask on Telegram",
      "providerIds": [
        "andrij-pycha"
      ]
    },
    {
      "id": "interview-recording-production",
      "slug": "interview-recording-production",
      "title": "Interview and 4K Recording",
      "description": "Interview facilitation and 4K recording for people, projects and community stories.",
      "status": "By request",
      "duration": "Depends on the production scope",
      "format": "Individual or team",
      "delivery": "In person",
      "location": "Prague / by arrangement",
      "price": "Pricing on request",
      "topicIds": [
        "media",
        "community"
      ],
      "practitionerIds": [
        "andrij-pycha"
      ],
      "placeIds": [
        "santiago-studio-praha"
      ],
      "eventFormatIds": [
        "santiago-talks"
      ],
      "provider": "Santiago Talks & Interviews",
      "detailUrl": "openmic.html",
      "contactUrl": "https://t.me/santioago_bot",
      "contactLabel": "Ask on Telegram",
      "providerIds": [
        "andrij-pycha"
      ]
    },
    {
      "id": "startup-marketing-automation",
      "slug": "startup-marketing-automation",
      "title": "Startup, Marketing, and Automation",
      "description": "Project support connecting startup direction, ethical marketing and practical automation.",
      "status": "By request",
      "duration": "Depends on the project scope",
      "format": "Individual or team",
      "delivery": "By arrangement",
      "location": "Prague / by arrangement",
      "price": "Pricing on request",
      "topicIds": [
        "business",
        "community"
      ],
      "practitionerIds": [
        "andrij-pycha"
      ],
      "placeIds": [],
      "eventFormatIds": [
        "project-co-creation-circle"
      ],
      "provider": "Ethical Marketing & Automation Agency",
      "detailUrl": "ethical-automation-agency.html",
      "contactUrl": "https://t.me/santioago_bot",
      "contactLabel": "Ask on Telegram",
      "providerIds": [
        "andrij-pycha"
      ]
    },
    {
      "id": "conscious-relationship-discovery",
      "slug": "conscious-relationship-discovery",
      "title": "Conscious Dating and Relationships",
      "description": "A developing group format for intentional connection, conscious dating and relationship discovery.",
      "status": "Coming soon",
      "duration": "Not published",
      "format": "Group",
      "delivery": "Hybrid concept",
      "location": "To be announced",
      "price": "Pricing on request",
      "topicIds": [
        "relationships",
        "personal-development",
        "community"
      ],
      "practitionerIds": [
        "andrij-pycha"
      ],
      "placeIds": [],
      "eventFormatIds": [
        "conscious-relationships"
      ],
      "provider": "Conscious Relationships Platform",
      "detailUrl": "conscious-relationships.html",
      "contactUrl": "https://t.me/santioago_bot",
      "contactLabel": "Ask on Telegram",
      "providerIds": [
        "andrij-pycha"
      ]
    }
  ],
  "providers": [
    {
      "id": "ivan-protinak",
      "slug": "ivan-protinak",
      "name": "Ivan Protinyak",
      "image": null,
      "imageAlt": "",
      "shortDescription": "Bodywork practitioner focused on rehabilitation, massage and attentive physical practice.",
      "approach": "Combines rehabilitation knowledge with massage and an individual, body-aware approach.",
      "fields": [
        "Rehabilitation",
        "Massage",
        "Bodywork"
      ],
      "topicIds": [
        "bodywork",
        "rehabilitation"
      ],
      "location": "Santiago Studio, Prague",
      "city": "Prague",
      "country": "Czech Republic",
      "coordinates": null,
      "locationPrecision": "city",
      "languages": [
        "Ukrainian (native)",
        "Russian (fluent)",
        "English (basic)"
      ],
      "onlineAvailability": "Not published",
      "experience": "5 years of experience; bachelor studies in Physical Therapy and Occupational Therapy.",
      "serviceIds": [
        "deep-massage"
      ],
      "placeIds": [
        "santiago-studio-praha"
      ],
      "eventFormatIds": [],
      "externalLinks": [],
      "profileUrl": "profile.html",
      "contactUrl": "suggest.html?topic=Deep%20Massage%20%26%20Tea%20Ceremony&details=I%20would%20like%20to%20contact%20Ivan%20Protinyak%20about%20his%20bodywork%20service%20at%20Santiago%20Studio%20in%20Prague.&city=Prague&preference=in_person#looking-for",
      "contactLabel": "Contact Ivan",
      "type": "practitioner"
    },
    {
      "id": "katerina",
      "slug": "katerina",
      "name": "Katerina",
      "image": null,
      "imageAlt": "",
      "shortDescription": "Wellness practitioner working with body practices, aromatherapy and retreat formats.",
      "approach": "Creates individual and group wellness programmes with body practices and sensory care.",
      "fields": [
        "Body practices",
        "Aromatherapy",
        "SPA retreats",
        "Visual production"
      ],
      "topicIds": [
        "wellness",
        "bodywork",
        "aromatherapy",
        "media"
      ],
      "location": "Czech Republic",
      "city": "Prague",
      "country": "Czech Republic",
      "coordinates": null,
      "locationPrecision": "city",
      "languages": [],
      "onlineAvailability": "Selected Zoom group formats are described on the existing offer page.",
      "experience": "The existing profile states 4 years of professional experience in the Czech Republic.",
      "serviceIds": [
        "wellness-programmes"
      ],
      "placeIds": [
        "santiago-studio-praha"
      ],
      "eventFormatIds": [],
      "externalLinks": [],
      "profileUrl": "profile-katerina.html",
      "contactUrl": "https://t.me/santioago_bot",
      "contactLabel": "Ask on Telegram",
      "type": "practitioner"
    },
    {
      "id": "violetta-blago",
      "slug": "violetta-blago",
      "name": "Violetta Blago",
      "image": null,
      "imageAlt": "",
      "shortDescription": "Facilitator of Lila, universal therapy, constellations, body therapy and women’s circles.",
      "approach": "Uses reflective and body-oriented practices to support personal inquiry.",
      "fields": [
        "Lila",
        "Universal therapy",
        "Constellations",
        "Body therapy",
        "Women’s circles"
      ],
      "topicIds": [
        "lila",
        "mind-body",
        "personal-development",
        "community"
      ],
      "location": "Europe / Prague community",
      "city": "Prague",
      "country": "Czech Republic",
      "coordinates": null,
      "locationPrecision": "city",
      "languages": [],
      "onlineAvailability": "Not published",
      "experience": "The existing profile describes 5 years of exploring Lila.",
      "serviceIds": [
        "lila-reading",
        "universal-therapy-constellations"
      ],
      "placeIds": [],
      "eventFormatIds": [],
      "externalLinks": [
        {
          "label": "Telegram",
          "url": "https://t.me/violettablago"
        }
      ],
      "profileUrl": "profile-violetta.html",
      "contactUrl": "https://t.me/violettablago",
      "contactLabel": "Contact Violetta on Telegram",
      "type": "practitioner"
    },
    {
      "id": "andrij-pycha",
      "slug": "andrij-pycha",
      "name": "Andrij Pycha",
      "image": null,
      "imageAlt": "",
      "shortDescription": "Community facilitator working across relationships, media, AI, marketing and project development.",
      "approach": "Connects personal discovery, community formats and practical project development.",
      "fields": [
        "Facilitation",
        "Relationships",
        "Media",
        "AI",
        "Marketing",
        "Project development"
      ],
      "topicIds": [
        "relationships",
        "personal-development",
        "media",
        "business",
        "community"
      ],
      "location": "Prague · UA/CZ",
      "city": "Prague",
      "country": "Czech Republic",
      "coordinates": null,
      "locationPrecision": "city",
      "languages": [
        "Ukrainian",
        "Czech",
        "Russian",
        "English",
        "Polish"
      ],
      "onlineAvailability": "Not published",
      "experience": "Experience is described through community, media, marketing and technology projects; no duration is published.",
      "serviceIds": [
        "purpose-brand-discovery",
        "interview-recording-production",
        "startup-marketing-automation",
        "conscious-relationship-discovery"
      ],
      "placeIds": [],
      "eventFormatIds": [
        "conscious-relationships",
        "santiago-talks",
        "project-co-creation-circle"
      ],
      "externalLinks": [],
      "profileUrl": "profile-andrij.html",
      "contactUrl": "https://t.me/santioago_bot",
      "contactLabel": "Ask on Telegram",
      "type": "practitioner"
    }
  ],
  "practitioners": [
    {
      "id": "ivan-protinak",
      "slug": "ivan-protinak",
      "name": "Ivan Protinyak",
      "image": null,
      "imageAlt": "",
      "shortDescription": "Bodywork practitioner focused on rehabilitation, massage and attentive physical practice.",
      "approach": "Combines rehabilitation knowledge with massage and an individual, body-aware approach.",
      "fields": [
        "Rehabilitation",
        "Massage",
        "Bodywork"
      ],
      "topicIds": [
        "bodywork",
        "rehabilitation"
      ],
      "location": "Santiago Studio, Prague",
      "city": "Prague",
      "country": "Czech Republic",
      "coordinates": null,
      "locationPrecision": "city",
      "languages": [
        "Ukrainian (native)",
        "Russian (fluent)",
        "English (basic)"
      ],
      "onlineAvailability": "Not published",
      "experience": "5 years of experience; bachelor studies in Physical Therapy and Occupational Therapy.",
      "serviceIds": [
        "deep-massage"
      ],
      "placeIds": [
        "santiago-studio-praha"
      ],
      "eventFormatIds": [],
      "externalLinks": [],
      "profileUrl": "profile.html",
      "contactUrl": "suggest.html?topic=Deep%20Massage%20%26%20Tea%20Ceremony&details=I%20would%20like%20to%20contact%20Ivan%20Protinyak%20about%20his%20bodywork%20service%20at%20Santiago%20Studio%20in%20Prague.&city=Prague&preference=in_person#looking-for",
      "contactLabel": "Contact Ivan",
      "type": "practitioner"
    },
    {
      "id": "katerina",
      "slug": "katerina",
      "name": "Katerina",
      "image": null,
      "imageAlt": "",
      "shortDescription": "Wellness practitioner working with body practices, aromatherapy and retreat formats.",
      "approach": "Creates individual and group wellness programmes with body practices and sensory care.",
      "fields": [
        "Body practices",
        "Aromatherapy",
        "SPA retreats",
        "Visual production"
      ],
      "topicIds": [
        "wellness",
        "bodywork",
        "aromatherapy",
        "media"
      ],
      "location": "Czech Republic",
      "city": "Prague",
      "country": "Czech Republic",
      "coordinates": null,
      "locationPrecision": "city",
      "languages": [],
      "onlineAvailability": "Selected Zoom group formats are described on the existing offer page.",
      "experience": "The existing profile states 4 years of professional experience in the Czech Republic.",
      "serviceIds": [
        "wellness-programmes"
      ],
      "placeIds": [
        "santiago-studio-praha"
      ],
      "eventFormatIds": [],
      "externalLinks": [],
      "profileUrl": "profile-katerina.html",
      "contactUrl": "https://t.me/santioago_bot",
      "contactLabel": "Ask on Telegram",
      "type": "practitioner"
    },
    {
      "id": "violetta-blago",
      "slug": "violetta-blago",
      "name": "Violetta Blago",
      "image": null,
      "imageAlt": "",
      "shortDescription": "Facilitator of Lila, universal therapy, constellations, body therapy and women’s circles.",
      "approach": "Uses reflective and body-oriented practices to support personal inquiry.",
      "fields": [
        "Lila",
        "Universal therapy",
        "Constellations",
        "Body therapy",
        "Women’s circles"
      ],
      "topicIds": [
        "lila",
        "mind-body",
        "personal-development",
        "community"
      ],
      "location": "Europe / Prague community",
      "city": "Prague",
      "country": "Czech Republic",
      "coordinates": null,
      "locationPrecision": "city",
      "languages": [],
      "onlineAvailability": "Not published",
      "experience": "The existing profile describes 5 years of exploring Lila.",
      "serviceIds": [
        "lila-reading",
        "universal-therapy-constellations"
      ],
      "placeIds": [],
      "eventFormatIds": [],
      "externalLinks": [
        {
          "label": "Telegram",
          "url": "https://t.me/violettablago"
        }
      ],
      "profileUrl": "profile-violetta.html",
      "contactUrl": "https://t.me/violettablago",
      "contactLabel": "Contact Violetta on Telegram",
      "type": "practitioner"
    },
    {
      "id": "andrij-pycha",
      "slug": "andrij-pycha",
      "name": "Andrij Pycha",
      "image": null,
      "imageAlt": "",
      "shortDescription": "Community facilitator working across relationships, media, AI, marketing and project development.",
      "approach": "Connects personal discovery, community formats and practical project development.",
      "fields": [
        "Facilitation",
        "Relationships",
        "Media",
        "AI",
        "Marketing",
        "Project development"
      ],
      "topicIds": [
        "relationships",
        "personal-development",
        "media",
        "business",
        "community"
      ],
      "location": "Prague · UA/CZ",
      "city": "Prague",
      "country": "Czech Republic",
      "coordinates": null,
      "locationPrecision": "city",
      "languages": [
        "Ukrainian",
        "Czech",
        "Russian",
        "English",
        "Polish"
      ],
      "onlineAvailability": "Not published",
      "experience": "Experience is described through community, media, marketing and technology projects; no duration is published.",
      "serviceIds": [
        "purpose-brand-discovery",
        "interview-recording-production",
        "startup-marketing-automation",
        "conscious-relationship-discovery"
      ],
      "placeIds": [],
      "eventFormatIds": [
        "conscious-relationships",
        "santiago-talks",
        "project-co-creation-circle"
      ],
      "externalLinks": [],
      "profileUrl": "profile-andrij.html",
      "contactUrl": "https://t.me/santioago_bot",
      "contactLabel": "Ask on Telegram",
      "type": "practitioner"
    }
  ],
  "places": [
    {
      "id": "santiago-studio-praha",
      "slug": "santiago-studio-praha",
      "name": "Santiago Studio Praha",
      "description": "An active Prague studio used for body practices, women’s circles, community formats, filming and space rental.",
      "type": "Studio",
      "status": "Active",
      "city": "Prague",
      "country": "Czech Republic",
      "address": null,
      "mapUrl": null,
      "coordinates": null,
      "locationPrecision": "city",
      "topicIds": [
        "bodywork",
        "wellness",
        "media",
        "community"
      ],
      "practitionerIds": [
        "ivan-protinak",
        "katerina"
      ],
      "serviceIds": [
        "deep-massage",
        "wellness-programmes",
        "interview-recording-production"
      ],
      "eventFormatIds": [
        "santiago-talks"
      ],
      "detailUrl": "space.html#place-santiago-studio-praha",
      "contactUrl": "suggest.html?topic=Santiago%20Studio%20Praha&details=I%20would%20like%20to%20ask%20about%20Santiago%20Studio%20and%20the%20services%20available%20there%20in%20Prague.&city=Prague&preference=in_person#looking-for",
      "contactLabel": "Ask about this place",
      "providerIds": [
        "ivan-protinak",
        "katerina"
      ]
    }
  ],
  "eventFormats": [
    {
      "id": "conscious-relationships",
      "slug": "conscious-relationships",
      "title": "Conscious Relationships",
      "description": "A developing group format for intentional connection, conscious dating and relationship exploration.",
      "kind": "format",
      "status": "Concept · first group forming",
      "format": "Hybrid concept",
      "location": "To be announced",
      "organizer": "Conscious Relationships Platform",
      "topicIds": [
        "relationships",
        "personal-development",
        "community"
      ],
      "practitionerIds": [
        "andrij-pycha"
      ],
      "placeIds": [],
      "serviceIds": [
        "conscious-relationship-discovery"
      ],
      "detailUrl": "conscious-relationships.html",
      "contactUrl": "https://t.me/santioago_bot",
      "contactLabel": "Ask about the format on Telegram",
      "providerIds": [
        "andrij-pycha"
      ]
    },
    {
      "id": "santiago-talks",
      "slug": "santiago-talks",
      "title": "Santiago Talks & Interviews",
      "description": "An interview and community-story format connected to Open Mic and 4K production.",
      "kind": "format",
      "status": "Available by request",
      "format": "In person",
      "location": "Prague / by arrangement",
      "organizer": "Open Mic",
      "topicIds": [
        "media",
        "community"
      ],
      "practitionerIds": [
        "andrij-pycha"
      ],
      "placeIds": [
        "santiago-studio-praha"
      ],
      "serviceIds": [
        "interview-recording-production"
      ],
      "detailUrl": "openmic.html",
      "contactUrl": "https://t.me/santioago_bot",
      "contactLabel": "Ask about the format on Telegram",
      "providerIds": [
        "andrij-pycha"
      ]
    },
    {
      "id": "project-co-creation-circle",
      "slug": "project-co-creation-circle",
      "title": "Project Co-creation Circle",
      "description": "A developing format for people to discuss, shape and support early community projects.",
      "kind": "format",
      "status": "Format in development",
      "format": "Hybrid concept",
      "location": "To be announced",
      "organizer": "Santiago Incubator",
      "topicIds": [
        "business",
        "community"
      ],
      "practitionerIds": [
        "andrij-pycha"
      ],
      "placeIds": [],
      "serviceIds": [
        "startup-marketing-automation"
      ],
      "detailUrl": "projects.html",
      "contactUrl": "https://t.me/santioago_bot",
      "contactLabel": "Ask about the format on Telegram",
      "providerIds": [
        "andrij-pycha"
      ]
    }
  ],
  "scheduledEvents": []
};

  data.getById = function (collection, id) {
    var records = data[collection];
    if (!Array.isArray(records)) return null;
    for (var index = 0; index < records.length; index += 1) {
      if (records[index].id === id) return records[index];
    }
    return null;
  };

  data.related = function (record, collection, field) {
    var ids = record && Array.isArray(record[field]) ? record[field] : [];
    return ids.map(function (id) { return data.getById(collection, id); }).filter(Boolean);
  };

  root.LumeyaData = data;
  if (root.document) {
    var event;
    if (typeof root.CustomEvent === 'function') {
      event = new root.CustomEvent('lumeya:data-ready', { detail: data });
    } else {
      event = root.document.createEvent('CustomEvent');
      event.initCustomEvent('lumeya:data-ready', false, false, data);
    }
    root.document.dispatchEvent(event);
  }
})(window);
