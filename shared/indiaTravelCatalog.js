const statePlaces = {
  'Andhra Pradesh': 'Visakhapatnam|Vijayawada|Tirupati|Amaravati|Araku Valley',
  'Arunachal Pradesh': 'Tawang|Itanagar|Ziro|Bomdila',
  Assam: 'Guwahati|Kaziranga|Majuli|Jorhat|Sivasagar',
  Bihar: 'Patna|Bodh Gaya|Nalanda|Rajgir',
  Chhattisgarh: 'Raipur|Jagdalpur|Chitrakote|Sirpur',
  Goa: 'Panaji|Calangute|Baga|Anjuna|Palolem|Colva',
  Gujarat: 'Ahmedabad|Vadodara|Surat|Dwarka|Somnath|Gir|Rann of Kutch|Bhuj',
  Haryana: 'Gurugram|Faridabad|Kurukshetra|Panipat',
  'Himachal Pradesh': 'Shimla|Manali|Kasol|Dharamshala|McLeod Ganj|Dalhousie|Spiti Valley|Kullu',
  Jharkhand: 'Ranchi|Jamshedpur|Deoghar|Netarhat',
  Karnataka: 'Bengaluru~Bangalore|Mysuru~Mysore|Mangaluru~Mangalore|Udupi|Coorg~Kodagu|Chikkamagaluru|Hampi|Gokarna|Shivamogga|Kabini|Jog Falls|Badami|Pattadakal|Aihole',
  Kerala: 'Kochi|Thiruvananthapuram|Munnar|Alappuzha~Alleppey|Wayanad|Varkala|Kovalam|Thekkady|Kumarakom|Kozhikode',
  'Madhya Pradesh': 'Bhopal|Indore|Ujjain|Khajuraho|Gwalior|Orchha|Pachmarhi|Sanchi|Kanha|Bandhavgarh',
  Maharashtra: 'Mumbai|Pune|Nashik|Lonavala|Mahabaleshwar|Chhatrapati Sambhajinagar~Aurangabad|Alibaug|Shirdi|Ratnagiri',
  Manipur: 'Imphal|Loktak Lake|Ukhrul',
  Meghalaya: 'Shillong|Cherrapunji~Sohra|Dawki|Mawlynnong',
  Mizoram: 'Aizawl|Champhai|Lunglei',
  Nagaland: 'Kohima|Dimapur|Dzukou Valley',
  Odisha: 'Bhubaneswar|Puri|Konark|Cuttack|Chilika Lake|Gopalpur',
  Punjab: 'Amritsar|Ludhiana|Patiala|Jalandhar',
  Rajasthan: 'Jaipur|Udaipur|Jodhpur|Jaisalmer|Pushkar|Ajmer|Bikaner|Mount Abu|Ranthambore',
  Sikkim: 'Gangtok|Pelling|Lachung|Yumthang Valley',
  'Tamil Nadu': 'Chennai|Ooty|Kodaikanal|Coimbatore|Madurai|Rameswaram|Thanjavur|Mahabalipuram|Kanyakumari|Puducherry~Pondicherry',
  Telangana: 'Hyderabad|Warangal|Karimnagar|Nagarjuna Sagar',
  Tripura: 'Agartala|Unakoti|Neermahal',
  'Uttar Pradesh': 'Lucknow|Agra|Varanasi|Ayodhya|Mathura|Vrindavan|Prayagraj|Sarnath',
  Uttarakhand: 'Dehradun|Rishikesh|Haridwar|Mussoorie|Nainital|Auli|Kedarnath|Badrinath|Jim Corbett|Valley of Flowers',
  'West Bengal': 'Kolkata|Darjeeling|Kalimpong|Siliguri|Digha|Sundarbans',
  Delhi: 'New Delhi|Old Delhi|India Gate|Red Fort|Qutub Minar',
  'Jammu & Kashmir': 'Srinagar|Gulmarg|Pahalgam|Sonamarg|Jammu',
  Ladakh: 'Leh|Nubra Valley|Pangong Lake|Tso Moriri|Khardung La',
  Puducherry: 'Puducherry|Auroville',
  'Andaman & Nicobar Islands': 'Port Blair|Havelock Island~Swaraj Dweep|Neil Island~Shaheed Dweep',
  Lakshadweep: 'Kavaratti|Agatti|Bangaram',
  'Dadra and Nagar Haveli and Daman and Diu': 'Daman|Diu|Silvassa',
  Chandigarh: 'Chandigarh'
};

const stateProfiles = {
  'Andhra Pradesh': { region: 'South India', season: 'October to February', budget: 2600, identity: 'Bay of Bengal coast, temple towns, and Eastern Ghats landscapes', food: 'Andhra meals, gongura, pulihora, and coastal seafood', safety: 'Check coastal weather and temple visitor guidance; use registered intercity transport.' },
  'Arunachal Pradesh': { region: 'Northeast India', season: 'October to April', budget: 3800, identity: 'Eastern Himalayan valleys, monasteries, and high-altitude communities', food: 'Thukpa, momos, smoked local dishes, and millet-based meals', safety: 'Check permits, road conditions, and weather before travel; carry warm layers.' },
  Assam: { region: 'Northeast India', season: 'October to April', budget: 3000, identity: 'Brahmaputra river landscapes, tea country, and wildlife habitats', food: 'Assamese thalis, tenga fish curry, pitha, and tea', safety: 'Use authorized park operators and check seasonal flood and wildlife advisories.' },
  Bihar: { region: 'East India', season: 'October to March', budget: 2200, identity: 'Ancient learning centers, Buddhist heritage, and Ganges river cities', food: 'Litti chokha, sattu dishes, thekua, and seasonal sweets', safety: 'Use registered guides at archaeological sites and keep valuables secure in busy markets.' },
  Chhattisgarh: { region: 'Central India', season: 'October to February', budget: 2400, identity: 'Waterfalls, forest reserves, and living tribal arts', food: 'Chila, fara, red ant chutney where locally offered, and rice-based meals', safety: 'Confirm local access and road conditions before visiting forest and waterfall areas.' },
  Goa: { region: 'West India', season: 'November to February', budget: 4000, identity: 'Arabian Sea beaches, Indo-Portuguese heritage, and coastal villages', food: 'Goan fish curry, xacuti, poi, bebinca, and vegetarian coastal dishes', safety: 'Use marked swimming zones, licensed taxis, and local beach and monsoon advisories.' },
  Gujarat: { region: 'West India', season: 'October to March', budget: 2800, identity: 'Stepwells, pilgrimage circuits, wildlife, and the salt desert', food: 'Gujarati thali, dhokla, thepla, and regional Kathiawadi dishes', safety: 'Check protected-area permits and heat conditions; use official pilgrimage information.' },
  Haryana: { region: 'North India', season: 'October to March', budget: 2700, identity: 'Historic battlefields, urban culture, and northern plains', food: 'Bajra roti, kadhi, seasonal greens, and North Indian meals', safety: 'Use marked pedestrian routes at heritage areas and plan around summer heat.' },
  'Himachal Pradesh': { region: 'North India', season: 'March to June and September to November', budget: 3800, identity: 'Himalayan valleys, cedar forests, mountain towns, and trekking routes', food: 'Himachali dham, siddu, trout where locally available, and mountain tea', safety: 'Check road, snow, and trekking advisories; acclimatize at altitude and avoid closed routes.' },
  Jharkhand: { region: 'East India', season: 'October to February', budget: 2500, identity: 'Plateau forests, waterfalls, and pilgrimage towns', food: 'Dhuska, rugra dishes, pitha, and rice-based regional meals', safety: 'Confirm waterfall access and daylight travel plans during the monsoon season.' },
  Karnataka: { region: 'South India', season: 'October to March', budget: 2800, identity: 'Vijayanagara heritage, Western Ghats, temple towns, and Arabian Sea coast', food: 'Kannada meals, ragi mudde, dosa, coastal curry, and regional sweets', safety: 'Follow site rules at monuments and check coastal or hill-road advisories for the season.' },
  Kerala: { region: 'South India', season: 'October to March', budget: 3300, identity: 'Backwaters, Western Ghats, spice gardens, and Arabian Sea shores', food: 'Appam, Kerala sadya, Malabar dishes, and seasonal seafood', safety: 'Check monsoon and sea conditions; book licensed backwater operators and follow wildlife guidance.' },
  'Madhya Pradesh': { region: 'Central India', season: 'October to March', budget: 2800, identity: 'Central Indian forests, temple architecture, forts, and national parks', food: 'Poha, dal bafla, bhutte ka kees, and regional thalis', safety: 'Use authorized safari operators and follow monument and wildlife-park rules.' },
  Maharashtra: { region: 'West India', season: 'October to February', budget: 3500, identity: 'Deccan forts, Western Ghats hill country, coast, and major urban centers', food: 'Maharashtrian thali, misal pav, vada pav, and Konkan seafood', safety: 'Check monsoon trail conditions and use official transport and heritage-site information.' },
  Manipur: { region: 'Northeast India', season: 'October to March', budget: 3000, identity: 'Loktak Lake, green hill ranges, and distinctive Manipuri arts', food: 'Eromba, singju, rice meals, and seasonal local produce', safety: 'Check current local travel advisories and lake or hill access before setting out.' },
  Meghalaya: { region: 'Northeast India', season: 'October to April', budget: 3200, identity: 'Living root bridges, limestone caves, waterfalls, and Khasi hill towns', food: 'Jadoh, tungrymbai, smoked meats, and local rice dishes', safety: 'Check rainfall and water levels before cave, river, and waterfall visits.' },
  Mizoram: { region: 'Northeast India', season: 'October to March', budget: 3000, identity: 'Forest-covered hills, ridge-top towns, and Mizo cultural traditions', food: 'Bai, sawhchiar, local greens, and rice-based meals', safety: 'Check inter-district road conditions and local visitor guidance before travel.' },
  Nagaland: { region: 'Northeast India', season: 'October to April', budget: 3200, identity: 'Naga hill landscapes, craft traditions, and community festivals', food: 'Smoked pork, bamboo shoot dishes, axone, and rice', safety: 'Respect community customs, confirm festival dates, and check current travel advisories.' },
  Odisha: { region: 'East India', season: 'October to February', budget: 2600, identity: 'Kalinga temples, Bay of Bengal coastline, crafts, and wetland habitats', food: 'Dalma, pakhala, chhena sweets, and coastal seafood', safety: 'Check beach flags and cyclone or monsoon advisories; follow conservation rules at wetlands.' },
  Punjab: { region: 'North India', season: 'October to March', budget: 2800, identity: 'Sikh heritage, fertile plains, and lively food and market culture', food: 'Sarson da saag, makki di roti, Amritsari kulcha, and lassi', safety: 'Respect religious-site customs and use authorized transport for intercity travel.' },
  Rajasthan: { region: 'North India', season: 'October to March', budget: 3200, identity: 'Desert landscapes, stepwells, forts, palaces, and historic trading towns', food: 'Dal baati churma, ker sangri, gatte ki sabzi, and regional sweets', safety: 'Plan for heat, carry water, and use authorized wildlife and desert operators.' },
  Sikkim: { region: 'Northeast India', season: 'March to May and October to December', budget: 3800, identity: 'Eastern Himalayan monasteries, alpine valleys, and mountain lakes', food: 'Momos, thukpa, phagshapa, and local fermented foods', safety: 'Check permits, road closures, altitude guidance, and weather before mountain travel.' },
  'Tamil Nadu': { region: 'South India', season: 'November to February', budget: 2800, identity: 'Dravidian temple cities, classical arts, hill stations, and long coastlines', food: 'Idli, dosa, Chettinad dishes, filter coffee, and regional meals', safety: 'Follow temple dress and photography rules and check coastal conditions during monsoon periods.' },
  Telangana: { region: 'South India', season: 'October to February', budget: 2700, identity: 'Deccan forts, historic stepwells, lake country, and urban culture', food: 'Hyderabadi biryani, haleem in season, sarva pindi, and Telangana meals', safety: 'Use registered transport in cities and check heat conditions for outdoor heritage visits.' },
  Tripura: { region: 'Northeast India', season: 'October to March', budget: 2500, identity: 'Palace heritage, forested hills, and archaeological sites', food: 'Mui borok, berma-based dishes, bamboo shoot, and rice', safety: 'Confirm opening hours and local access before visiting remote archaeological sites.' },
  'Uttar Pradesh': { region: 'North India', season: 'October to March', budget: 2800, identity: 'Mughal monuments, sacred river cities, and historic pilgrimage routes', food: 'Awadhi kebabs, Banarasi snacks, chaat, and regional sweets', safety: 'Use official monument entrances and registered guides; plan for dense crowds at major sites.' },
  Uttarakhand: { region: 'North India', season: 'March to June and September to November', budget: 3400, identity: 'Himalayan pilgrimage routes, river valleys, forests, and hill stations', food: 'Kafuli, aloo ke gutke, mandua roti, and Garhwali or Kumaoni meals', safety: 'Check pilgrimage registrations, weather, river conditions, and trail closures before travel.' },
  'West Bengal': { region: 'East India', season: 'October to March', budget: 3000, identity: 'Bengal delta landscapes, Himalayan tea country, and art and literature heritage', food: 'Bengali fish curry, shukto, kathi rolls, and mishti doi', safety: 'Check tide and forest guidance in the Sundarbans and road conditions in hill areas.' },
  Delhi: { region: 'North India', season: 'October to March', budget: 3300, identity: 'India’s capital, Mughal-era monuments, museums, and historic market lanes', food: 'Chaat, parathas, kebabs, and North Indian thalis', safety: 'Use official metro and visitor services; keep belongings secure in crowded markets.' },
  'Jammu & Kashmir': { region: 'North India', season: 'April to October', budget: 4200, identity: 'Kashmir Valley gardens, Himalayan lakes, and Jammu pilgrimage heritage', food: 'Kashmiri wazwan, kahwa, dum aloo, and local breads', safety: 'Check current travel advisories, road access, weather, and seasonal permits.' },
  Ladakh: { region: 'North India', season: 'May to September', budget: 5000, identity: 'High-altitude desert, Buddhist monasteries, and dramatic mountain lakes', food: 'Thukpa, skyu, momos, and butter tea', safety: 'Acclimatize gradually, carry water, and check road and high-altitude health advisories.' },
  Puducherry: { region: 'South India', season: 'November to February', budget: 3200, identity: 'French-era waterfront streets, Tamil heritage, and quiet coastal promenades', food: 'Tamil coastal meals, seafood, baguettes, and Creole-influenced dishes', safety: 'Use marked beach access and check sea conditions before swimming.' },
  'Andaman & Nicobar Islands': { region: 'Islands of India', season: 'November to April', budget: 5500, identity: 'Island beaches, coral reefs, marine habitats, and colonial history', food: 'Island seafood, coconut dishes, and Bengali and South Indian meals', safety: 'Follow marine park permits, ferry advisories, reef protection guidance, and beach flags.' },
  Lakshadweep: { region: 'Islands of India', season: 'October to March', budget: 6500, identity: 'Coral atolls, lagoons, and protected marine ecosystems', food: 'Tuna, coconut-rich island dishes, and rice meals', safety: 'Travel requires current permits and authorized transport; follow reef and sea-safety rules.' },
  'Dadra and Nagar Haveli and Daman and Diu': { region: 'West India', season: 'October to March', budget: 3000, identity: 'Gujarat coast, Portuguese-era districts, and wooded inland landscapes', food: 'Gujarati thali, coastal fish, and regional snacks', safety: 'Check beach conditions, heritage-site access, and current local travel notices.' },
  Chandigarh: { region: 'North India', season: 'October to March', budget: 3000, identity: 'Planned modernist city, gardens, and foothill gateway', food: 'Punjabi meals, chole bhature, and North Indian street food', safety: 'Use marked paths in gardens and official transport connections for regional travel.' }
};

const aliasGroups = [
  ['Mangaluru', 'Mangalore'], ['Bengaluru', 'Bangalore'], ['Mysuru', 'Mysore'], ['Coorg', 'Kodagu'],
  ['Alappuzha', 'Alleppey'], ['Chhatrapati Sambhajinagar', 'Aurangabad'], ['Puducherry', 'Pondicherry'],
  ['Sohra', 'Cherrapunji'], ['Swaraj Dweep', 'Havelock Island', 'Havelock'], ['Shaheed Dweep', 'Neil Island', 'Neil'],
  ['Tiruvananthapuram', 'Trivandrum'], ['Ooty', 'Udhagamandalam'], ['Dzukou Valley', 'Dzükou Valley']
];

const aliasesByCanonical = new Map(aliasGroups.map(group => [normalize(group[0]), group.slice(1)]));
const canonicalAlias = new Map(aliasGroups.flatMap(group => group.map(alias => [normalize(alias), group[0]])));
const knownCoordinates = {
  bengaluru: [12.9716, 77.5946], mysuru: [12.2958, 76.6394], mangaluru: [12.9141, 74.856], udupi: [13.3409, 74.7421],
  goa: [15.2993, 74.124], panaji: [15.4909, 73.8278], hampi: [15.335, 76.46], kochi: [9.9312, 76.2673],
  munnar: [10.0889, 77.0595], chennai: [13.0827, 80.2707], hyderabad: [17.385, 78.4867], mumbai: [19.076, 72.8777],
  jaipur: [26.9124, 75.7872], udaipur: [24.5854, 73.7125], jodhpur: [26.2389, 73.0243], delhi: [28.6139, 77.209],
  'new delhi': [28.6139, 77.209], agra: [27.1767, 78.0081], varanasi: [25.3176, 82.9739], kolkata: [22.5726, 88.3639],
  darjeeling: [27.036, 88.2627], shimla: [31.1048, 77.1734], manali: [32.2432, 77.1892], leh: [34.1526, 77.5771],
  srinagar: [34.0837, 74.7973], gangtok: [27.3389, 88.6065], guwahati: [26.1445, 91.7362], visakhapatnam: [17.6868, 83.2185],
  bhubaneswar: [20.2961, 85.8245], amritsar: [31.634, 74.8723], rishikesh: [30.0869, 78.2676],
  'port blair': [11.6234, 92.7265], kavaratti: [10.5667, 72.6417], chandigarh: [30.7333, 76.7794]
};

const imageByCategory = {
  Beaches: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
  Mountains: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1000&q=80',
  Heritage: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1000&q=80',
  Wildlife: 'https://images.unsplash.com/photo-1549366021-9f761d450615?auto=format&fit=crop&w=1000&q=80',
  Nature: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1000&q=80',
  City: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1000&q=80'
};

const curatedSites = {
  'Visakhapatnam': ['Kailasagiri', 'Borra Caves', 'Rushikonda Beach'], 'Vijayawada': ['Kanaka Durga Temple', 'Prakasam Barrage', 'Undavalli Caves'],
  'Tirupati': ['Sri Venkateswara Temple', 'Kapila Theertham', 'Chandragiri Fort'], 'Araku Valley': ['Borra Caves', 'Padmapuram Gardens', 'Araku Tribal Museum'],
  'Tawang': ['Tawang Monastery', 'Sela Pass', 'Jaswant Garh'], 'Ziro': ['Talley Valley Wildlife Sanctuary', 'Ziro Music Festival grounds', 'Apatani villages'],
  'Guwahati': ['Kamakhya Temple', 'Umananda Island', 'Brahmaputra riverfront'], 'Kaziranga': ['Kaziranga National Park', 'Kaziranga Orchid Park', 'Brahmaputra river landscape'],
  'Majuli': ['Auniati Satra', 'Kamalabari Satra', 'Majuli river island villages'], 'Bodh Gaya': ['Mahabodhi Temple', 'Great Buddha Statue', 'Sujata Stupa'],
  'Nalanda': ['Nalanda Mahavihara', 'Nalanda Archaeological Museum', 'Hiuen Tsang Memorial Hall'], 'Chitrakote': ['Chitrakote Falls', 'Tirathgarh Falls', 'Kanger Valley National Park'],
  'Panaji': ['Fontainhas heritage quarter', 'Our Lady of the Immaculate Conception Church', 'Miramar Beach'], 'Baga': ['Baga Beach', 'Anjuna Flea Market', 'Chapora Fort'],
  'Dwarka': ['Dwarkadhish Temple', 'Rukmini Devi Temple', 'Gomti Ghat'], 'Somnath': ['Somnath Temple', 'Bhalka Tirth', 'Triveni Sangam'],
  'Rann of Kutch': ['White Rann', 'Kalo Dungar', 'Dhordo craft village'], 'Shimla': ['The Ridge', 'Jakhoo Temple', 'Kalka-Shimla Railway'],
  'Manali': ['Hadimba Devi Temple', 'Old Manali', 'Solang Valley'], 'Dharamshala': ['Namgyal Monastery', 'Bhagsunag Waterfall', 'Triund trail'],
  'Mangaluru': ['Panambur Beach', 'St. Aloysius Chapel', 'Tannirbhavi Beach'], 'Mysuru': ['Mysore Palace', 'Chamundi Hill', 'Devaraja Market'],
  'Hampi': ['Virupaksha Temple', 'Vijaya Vittala Temple', 'Matanga Hill'], 'Munnar': ['Eravikulam National Park', 'Tea Museum', 'Mattupetty Dam'],
  'Ujjain': ['Mahakaleshwar Jyotirlinga', 'Ram Ghat', 'Kal Bhairav Temple'], 'Mumbai': ['Gateway of India', 'Chhatrapati Shivaji Maharaj Terminus', 'Elephanta Caves'],
  'Shillong': ['Ward’s Lake', 'Shillong Peak', 'Don Bosco Museum'], 'Puri': ['Jagannath Temple', 'Puri Beach', 'Raghurajpur artisan village'],
  'Jaipur': ['Amber Fort', 'Hawa Mahal', 'Jantar Mantar'], 'Udaipur': ['City Palace', 'Lake Pichola', 'Saheliyon ki Bari'],
  'Gangtok': ['Rumtek Monastery', 'Enchey Monastery', 'Tsomgo Lake'], 'Chennai': ['Marina Beach', 'Kapaleeshwarar Temple', 'Government Museum'],
  'Hyderabad': ['Charminar', 'Golconda Fort', 'Salar Jung Museum'], 'Varanasi': ['Dashashwamedh Ghat', 'Kashi Vishwanath Temple', 'Sarnath'],
  'Dehradun': ['Forest Research Institute', 'Robber’s Cave', 'Tapkeshwar Temple'], 'Kolkata': ['Victoria Memorial', 'Howrah Bridge', 'Indian Museum'],
  'New Delhi': ['Red Fort', 'Qutub Minar', 'India Gate'], 'Srinagar': ['Dal Lake', 'Mughal Gardens', 'Shankaracharya Temple'],
  'Leh': ['Leh Palace', 'Shanti Stupa', 'Hall of Fame'], 'Puducherry': ['Promenade Beach', 'French Quarter', 'Auroville']
};

const stateCategories = {
  'Andhra Pradesh': ['Temples', 'Beaches', 'Nature'], 'Arunachal Pradesh': ['Mountains', 'Nature', 'Culture'], Assam: ['Wildlife', 'Nature', 'Culture'],
  Bihar: ['Heritage', 'Temples', 'Culture'], Chhattisgarh: ['Waterfalls', 'Nature', 'Wildlife'], Goa: ['Beaches', 'Food', 'Heritage'], Gujarat: ['Heritage', 'Temples', 'Wildlife'], Haryana: ['Heritage', 'Culture', 'Nature'],
  'Himachal Pradesh': ['Mountains', 'Adventure', 'Nature'], Jharkhand: ['Waterfalls', 'Nature', 'Culture'], Karnataka: ['Heritage', 'Beaches', 'Food'], Kerala: ['Nature', 'Beaches', 'Food'],
  'Madhya Pradesh': ['Wildlife', 'Heritage', 'Temples'], Maharashtra: ['Heritage', 'Mountains', 'Beaches'], Manipur: ['Nature', 'Culture', 'Lakes'], Meghalaya: ['Waterfalls', 'Nature', 'Adventure'],
  Mizoram: ['Mountains', 'Nature', 'Culture'], Nagaland: ['Culture', 'Mountains', 'Nature'], Odisha: ['Heritage', 'Beaches', 'Temples'], Punjab: ['Heritage', 'Food', 'Culture'],
  Rajasthan: ['Heritage', 'Forts', 'Culture'], Sikkim: ['Mountains', 'Nature', 'Adventure'], 'Tamil Nadu': ['Temples', 'Heritage', 'Beaches'], Telangana: ['Heritage', 'Food', 'Temples'],
  Tripura: ['Heritage', 'Nature', 'Culture'], 'Uttar Pradesh': ['Heritage', 'Temples', 'Culture'], Uttarakhand: ['Mountains', 'Nature', 'Adventure'], 'West Bengal': ['Culture', 'Mountains', 'Nature'],
  Delhi: ['Heritage', 'Museums', 'Food'], 'Jammu & Kashmir': ['Mountains', 'Nature', 'Lakes'], Ladakh: ['Mountains', 'Adventure', 'Lakes'], Puducherry: ['Beaches', 'Heritage', 'Food'],
  'Andaman & Nicobar Islands': ['Beaches', 'Wildlife', 'Adventure'], Lakshadweep: ['Beaches', 'Wildlife', 'Adventure'], 'Dadra and Nagar Haveli and Daman and Diu': ['Beaches', 'Nature', 'Heritage'], Chandigarh: ['Culture', 'Gardens', 'Heritage']
};

function normalize(value) {
  return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export const normalizeIndiaPlace = value => {
  const key = normalize(value);
  return canonicalAlias.get(key) ? normalize(canonicalAlias.get(key)) : key;
};

const slugify = value => normalize(value).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const classifyPlace = (name, categories) => {
  const text = name.toLowerCase();
  if (/beach|island|coast|baga|palolem|colva|daman|diu|agatti|bangaram/.test(text)) return 'Beaches';
  if (/valley|hills|hill|manali|shimla|spiti|tawang|ziro|auli|darjeeling|ooty|munnar|mount abu|gulmarg|sonamarg|pelling|lachung|leh|nubra|khardung|nainital|mussoorie/.test(text)) return 'Mountains';
  if (/park|sanctuary|wildlife|kaziranga|kanha|bandhavgarh|ranthambore|sundarbans|kabini|corbett/.test(text)) return 'Wildlife';
  if (/lake|sagar|loktak|pangong|moriri|chilika|kumarakom/.test(text)) return 'Lakes';
  if (/falls|waterfall|chitrakote|jog falls/.test(text)) return 'Waterfalls';
  if (/temple|tirupati|dwarka|somnath|shirdi|kedarnath|badrinath|ayodhya|mathura|vrindavan|sarnath|rameswaram/.test(text)) return 'Temples';
  if (/fort|heritage|hampi|badami|pattadakal|aihole|nalanda|khajuraho|sanchi|orchha|agra|jaipur|udaipur|jodhpur|jaisalmer|bikaner|konark|mahabalipuram|thanjavur|red fort|qutub|minar|india gate/.test(text)) return 'Heritage';
  return categories?.[0] || 'Culture';
};

const makeDescription = (name, state, profile, category) => `${name} is a ${category.toLowerCase()} destination in ${state}, known for ${profile.identity}. Explore its local food, landmarks, and neighborhood experiences at a pace that suits your trip.`;

export const buildIndiaDestinationCatalog = () => Object.entries(statePlaces).flatMap(([state, list]) => {
  const profile = stateProfiles[state];
  const categories = stateCategories[state] || ['Culture', 'Nature'];
  return list.split('|').map(entry => {
    const [rawName, ...inlineAliases] = entry.split('~');
    const name = rawName.trim();
    const aliases = [...inlineAliases, ...(aliasesByCanonical.get(normalize(name)) || [])];
    const category = classifyPlace(name, categories);
    const sites = curatedSites[name] || [`${name} central heritage and community area`, `${name} local market and food district`, `${name} regional nature and culture route`];
    const coords = knownCoordinates[normalize(name)] || [20.5937, 78.9629];
    const beyond = /anegundi|mawlynnong|majuli|ziro|araku|chitrakote|sirpur|netarhat|ukhrul|dawki|neermahal|pelling|auli|orchha|pachmarhi|pattadakal|aihole|badami|kabini|tso moriri|bangaram|auroville/.test(name.toLowerCase());
    return {
      id: `india-${slugify(name)}`,
      name,
      city: name,
      aliases,
      state,
      country: 'India',
      region: profile.region,
      identity: profile.identity,
      category,
      secondaryCategory: categories.find(item => item !== category) || 'Culture',
      description: makeDescription(name, state, profile, category),
      shortDescription: `${category} in ${state}: ${profile.identity}.`,
      image: imageByCategory[category] || imageByCategory.City,
      categories: [...new Set([category, ...categories])],
      bestTimeToVisit: profile.season,
      idealDuration: /valley|park|islands|lakshadweep|ladakh|andaman|corbett|sundarbans/i.test(name) ? '3–5 days' : /city|new delhi|mumbai|kolkata|chennai|hyderabad/i.test(name) ? '2–3 days' : '1–3 days',
      approxBudgetPerDay: profile.budget,
      estimatedDailyBudget: profile.budget,
      weather: { summary: `Seasonal conditions vary in ${name}; check a live forecast before travel.`, bestSeason: profile.season },
      popularFor: [...new Set([category, ...categories.slice(0, 2)])],
      attractions: sites,
      topAttractions: sites,
      localFood: profile.food,
      activities: [`Explore ${name} landmarks`, `Try regional food in ${name}`, `Discover ${profile.identity}`],
      safetyInfo: profile.safety,
      safetyTips: [profile.safety, 'Keep emergency numbers and accommodation details accessible.'],
      travelTips: [`Best season: ${profile.season}.`, 'Confirm opening hours, permits, and local transport before departure.'],
      nearbyPlaces: [],
      transportOptions: ['Intercity rail or bus', 'Local bus and taxi', 'Auto-rickshaw where available'],
      coordinates: { lat: coords[0], lng: coords[1] },
      latitude: coords[0],
      longitude: coords[1],
      bestTime: profile.season,
      estimatedBudget: profile.budget,
      localSpecialty: profile.food,
      popularActivities: [`Explore ${sites[0]}`, `Taste ${profile.food.split(',')[0]}`, `Discover ${name} on a local walk`],
      crowdLevel: beyond ? 'Low' : 'Moderate',
      safetyRating: 4.2,
      travelDifficulty: /valley|leh|ladakh|tawang|kedarnath|badrinath|spiti|pangong|moriri/i.test(name) ? 'Moderate' : 'Easy',
      isBeyondTheCrowd: beyond,
      beyondCrowdReason: beyond ? `A quieter way to explore ${profile.identity} with locally rooted cultural and nature visits.` : undefined,
      tags: [...new Set([category.toLowerCase(), state.toLowerCase(), profile.region.toLowerCase()])],
      dataQuality: 'curated destination guide with sample attraction suggestions'
    };
  });
});

export const findIndiaDestination = (query, catalog = buildIndiaDestinationCatalog()) => {
  const normalizedQuery = normalizeIndiaPlace(query);
  if (!normalizedQuery) return null;
  return catalog.find(item => normalizeIndiaPlace(item.name) === normalizedQuery || item.aliases?.some(alias => normalizeIndiaPlace(alias) === normalizedQuery)) ||
    catalog.find(item => normalize(item.state) === normalize(query)) ||
    catalog.find(item => normalizeIndiaPlace(item.name).includes(normalizedQuery) && normalizedQuery.length > 2) || null;
};

export const buildIndiaAttractions = (catalog = buildIndiaDestinationCatalog()) => catalog.flatMap(destination => {
  const sites = destination.topAttractions || destination.attractions || [];
  return sites.map((name, index) => ({
    id: `attraction-${destination.id}-${index + 1}`,
    name,
    destination: destination.name,
    destinationId: destination.id,
    city: destination.city,
    state: destination.state,
    category: index === 0 ? destination.category : (destination.categories[index % destination.categories.length] || destination.category),
    description: `${name} is a suggested point of interest for visitors exploring ${destination.name}. Confirm local access, opening times, and entry details before visiting.`,
    image: destination.image,
    openingHours: 'Check current venue information',
    entryFee: 'Check current venue information',
    averageVisitDuration: '1–3 hours',
    bestTimeToVisit: destination.bestTimeToVisit,
    crowdLevel: destination.crowdLevel,
    safetyRating: destination.safetyRating,
    accessibility: 'Accessibility details vary by site; contact the venue before travel.',
    nearbyAttractions: sites.filter(item => item !== name).slice(0, 3),
    nearbyRestaurants: [`Local food recommendations in ${destination.name}`],
    nearbyHotels: [`Stays in ${destination.name}`],
    activities: destination.activities,
    coordinates: destination.coordinates,
    destinationRecord: destination,
    beyondTheCrowd: destination.isBeyondTheCrowd,
    dataQuality: 'sample recommendation'
  }));
});

const regionalFoodTerms = {
  'Andhra Pradesh': ['Andhra thali', 'gongura dishes', 'coastal fish curry'], 'Arunachal Pradesh': ['thukpa', 'momos', 'smoked local dishes'], Assam: ['Assamese thali', 'tenga fish curry', 'pitha'],
  Bihar: ['litti chokha', 'sattu paratha', 'thekua'], Chhattisgarh: ['chila', 'fara', 'rice and seasonal greens'], Goa: ['Goan fish curry', 'poi and xacuti', 'bebinca'], Gujarat: ['Gujarati thali', 'dhokla', 'Kathiawadi meal'], Haryana: ['bajra roti', 'kadhi', 'seasonal greens'],
  'Himachal Pradesh': ['Himachali dham', 'siddu', 'mountain trout where available'], Jharkhand: ['dhuska', 'pitha', 'rice and forest greens'], Karnataka: ['regional Karnataka meals', 'neer dosa', 'coastal curry'], Kerala: ['Kerala sadya', 'appam and stew', 'Malabar meals'],
  'Madhya Pradesh': ['poha', 'dal bafla', 'bhutte ka kees'], Maharashtra: ['misal pav', 'Maharashtrian thali', 'Konkan seafood'], Manipur: ['eromba', 'singju', 'rice and seasonal vegetables'], Meghalaya: ['jadoh', 'tungrymbai', 'smoked local dishes'],
  Mizoram: ['bai', 'sawhchiar', 'rice and local greens'], Nagaland: ['smoked pork', 'bamboo shoot dishes', 'rice'], Odisha: ['dalma', 'pakhala', 'chhena sweets'], Punjab: ['Amritsari kulcha', 'makki di roti', 'Punjabi thali'],
  Rajasthan: ['dal baati churma', 'ker sangri', 'gatte ki sabzi'], Sikkim: ['momos', 'thukpa', 'phagshapa'], 'Tamil Nadu': ['idli and dosa', 'Chettinad dishes', 'filter coffee'], Telangana: ['Hyderabadi biryani', 'sarva pindi', 'Telangana meals'],
  Tripura: ['mui borok', 'bamboo shoot dishes', 'rice'], 'Uttar Pradesh': ['Awadhi kebabs', 'Banarasi snacks', 'regional chaat'], Uttarakhand: ['kafuli', 'mandua roti', 'Garhwali meals'], 'West Bengal': ['Bengali fish curry', 'kathi rolls', 'mishti doi'],
  Delhi: ['Old Delhi chaat', 'parathas', 'North Indian thali'], 'Jammu & Kashmir': ['Kashmiri wazwan', 'kahwa', 'local breads'], Ladakh: ['thukpa', 'skyu', 'butter tea'], Puducherry: ['Tamil coastal meals', 'seafood', 'Creole-influenced dishes'],
  'Andaman & Nicobar Islands': ['island seafood', 'coconut dishes', 'regional rice meals'], Lakshadweep: ['tuna', 'coconut-rich island dishes', 'rice meals'], 'Dadra and Nagar Haveli and Daman and Diu': ['Gujarati thali', 'coastal fish', 'regional snacks'], Chandigarh: ['Punjabi meals', 'chole bhature', 'North Indian street food']
};

export const getIndiaFoodSpecialties = state => regionalFoodTerms[state] || ['regional thali', 'local breakfast favorites', 'seasonal specialties'];

export const buildIndiaListingRecords = destination => {
  const place = typeof destination === 'string' ? findIndiaDestination(destination) : destination;
  if (!place) return { hotels: [], experiences: [], foods: [], guides: [] };
  const id = place.id;
  const name = place.name;
  const foods = getIndiaFoodSpecialties(place.state);
  const languages = place.region === 'South India' ? ['English', 'Hindi', 'Kannada'] : place.region === 'Northeast India' ? ['English', 'Hindi', 'Bengali'] : ['English', 'Hindi'];
  return {
    hotels: Array.from({ length: 3 }, (_, index) => ({
      id: `sample-${id}-stay-${index + 1}`, name: [`${name} Heritage Guesthouse · Sample`, `${name} Central Stay · Sample`, `${name} Regional Homestay · Sample`][index],
      area: `${name} central area`, destinationId: id, destinationName: name, type: ['Guesthouse', 'Budget Hotel', 'Homestay'][index],
      image: place.image, pricePerNight: [1800, 2800, 3600][index], rating: [4.2, 4.4, 4.3][index], reviewsCount: [24, 38, 19][index],
      amenities: ['WiFi', 'Air conditioning', 'Local recommendations'], distanceFromAttractions: `In the ${name} central area`,
      cancellationPolicy: 'Sample listing · confirm directly with the property', roomsAvailable: 0, availability: 'Sample availability · not bookable', verified: false,
      description: `Sample accommodation recommendation for visitors exploring ${name} and ${place.state}.`
    })),
    experiences: Array.from({ length: 4 }, (_, index) => ({
      id: `sample-${id}-experience-${index + 1}`, title: [`${name} Heritage and Neighborhood Walk · Sample`, `${name} Regional Food Walk · Sample`, `${name} Nature and Viewpoint Visit · Sample`, `${name} Local Craft Introduction · Sample`][index],
      destinationId: id, category: ['Heritage', 'Food', 'Nature', 'Handicrafts'][index], host: `TripEase sample host in ${name}`, hostVerified: false,
      price: [450, 650, 750, 550][index], duration: ['2 hours', '2 hours', '3 hours', '2 hours'][index], languages, rating: [4.5, 4.6, 4.4, 4.5][index], reviewsCount: 0,
      image: place.image, description: `A sample ${place.category.toLowerCase()} activity outline connected to ${place.identity || name}. Contact local operators to confirm actual availability.`,
      impactNote: 'Sample itinerary idea · no booking or host verification is provided.', location: `${name} central area`, availableSlots: 0, groupSize: 'Small group sample', safetyRating: 4.2, meetingPoint: `${name} visitor information point`, whatsIncluded: ['Local orientation', 'Suggested route']
    })),
    foods: Array.from({ length: 4 }, (_, index) => ({
      id: `sample-${id}-food-${index + 1}`, dishName: foods[index % foods.length], restaurantName: `${name} Regional Kitchen · Sample ${index + 1}`,
      destination: name, area: `${name} central area`, cuisine: `${place.state} regional cuisine`, dietary: index % 2 === 0 ? 'Pure Veg' : 'Non-Veg',
      iconicRestaurant: `${name} Regional Kitchen · Sample listing`, priceRange: '₹150–₹500', hygieneRating: 'Sample recommendation · check venue details',
      description: `A sample restaurant recommendation for trying ${foods[index % foods.length]} in ${name}. Venue, menu, hours, and dietary preparation must be confirmed directly.`,
      mustTryBadge: 'Regional sample', rating: 4.3, reviewsCount: 0, image: place.image, openingHours: 'Confirm directly with the restaurant', location: `${name} central area`,
      signatureDish: foods[index % foods.length], recommendedMeals: ['Lunch', 'Dinner'], dataQuality: 'sample'
    })),
    guides: Array.from({ length: 3 }, (_, index) => ({
      id: `sample-${id}-guide-${index + 1}`, name: `TripEase Sample Guide ${index + 1}`, destinationId: id, destinationName: name, city: name, state: place.state,
      photo: place.image, languages: index === 0 ? languages : [...languages, 'French'], expertise: [['Heritage', 'Local history'], ['Regional food', 'Markets'], ['Nature', 'Photography']][index],
      dailyFee: [1000, 1300, 1500][index], experienceYears: [3, 5, 7][index], rating: [4.4, 4.5, 4.3][index], reviewsCount: 0, verifiedBadge: 'Sample profile · not verified', verified: false,
      bio: `Sample guide profile for ${name}; not a real or verified provider.`, phone: 'Contact information unavailable', availability: 'Not bookable sample profile', description: `Sample guide concept with ${place.state} regional interests.`
    }))
  };
};

export const buildIndiaTransportOptions = (origin, destination, catalog = buildIndiaDestinationCatalog()) => {
  const from = typeof origin === 'string' ? findIndiaDestination(origin, catalog) : origin;
  const to = typeof destination === 'string' ? findIndiaDestination(destination, catalog) : destination;
  if (!from || !to) return [];
  const radians = degrees => degrees * Math.PI / 180;
  const latitudeDifference = radians(to.coordinates.lat - from.coordinates.lat);
  const longitudeDifference = radians(to.coordinates.lng - from.coordinates.lng);
  const distanceKm = Math.round(6371 * 2 * Math.asin(Math.sqrt(Math.sin(latitudeDifference / 2) ** 2 + Math.cos(radians(from.coordinates.lat)) * Math.cos(radians(to.coordinates.lat)) * Math.sin(longitudeDifference / 2) ** 2)));
  const distance = Math.max(15, distanceKm);
  const options = [
    { id: `route-sample-bus-${from.id}-${to.id}`, origin: from.name, destination: to.name, route: `${from.name} to ${to.name}`, type: 'Intercity bus · sample route', mode: 'Bus', operator: 'Operator information unavailable', duration: `${Math.max(1, Math.round(distance / 55))}–${Math.max(2, Math.round(distance / 42))} hours (estimate)`, distanceKm: distance, estimatedCost: Math.max(250, Math.round(distance * 1.6)), estimatedFare: Math.max(250, Math.round(distance * 1.6)), frequency: 'Check current operator schedules', departureInfo: 'Schedule unavailable · sample estimate', arrivalInfo: 'Schedule unavailable · sample estimate', bookingAvailable: false, ecoRating: 'Shared transport estimate', badge: 'Sample fare estimate', amenities: ['Confirm operator, time, and fare before travel'] },
    { id: `route-sample-train-${from.id}-${to.id}`, origin: from.name, destination: to.name, route: `${from.name} to ${to.name}`, type: 'Rail connection · sample route', mode: 'Train', operator: 'Indian Railways · check live timetable', duration: `${Math.max(1, Math.round(distance / 65))} hours or more (estimate)`, distanceKm: distance, estimatedCost: Math.max(180, Math.round(distance * 1.1)), estimatedFare: Math.max(180, Math.round(distance * 1.1)), frequency: 'Check current train schedules', departureInfo: 'Schedule unavailable · sample estimate', arrivalInfo: 'Schedule unavailable · sample estimate', bookingAvailable: false, ecoRating: 'Lower-emission shared transport option', badge: 'Sample fare estimate', amenities: ['Confirm route and availability on official railway channels'] },
    { id: `route-sample-cab-${from.id}-${to.id}`, origin: from.name, destination: to.name, route: `${from.name} to ${to.name}`, type: 'Private cab · sample route estimate', mode: 'Cab', operator: 'Local operator information unavailable', duration: `${Math.max(1, Math.round(distance / 50))} hours (estimate)`, distanceKm: distance, estimatedCost: Math.max(900, Math.round(distance * 12)), estimatedFare: Math.max(900, Math.round(distance * 12)), frequency: 'Availability varies', departureInfo: 'Confirm directly with a licensed operator', arrivalInfo: 'Route-dependent', bookingAvailable: false, ecoRating: 'Private vehicle estimate', badge: 'Sample fare estimate', amenities: ['Confirm licensed operator and final fare before booking'] }
  ];
  if (distance < 40) {
    options.push(
      { id: `route-sample-localbus-${from.id}`, origin: from.name, destination: to.name, route: `Local routes around ${from.name}`, type: 'Local bus · sample route', mode: 'Local bus', operator: 'Local transit authority information unavailable', duration: 'Route-dependent', distanceKm: distance, estimatedCost: 40, estimatedFare: 40, frequency: 'Check local stop and timetable', departureInfo: 'Timetable unavailable', arrivalInfo: 'Route-dependent', bookingAvailable: false, ecoRating: 'Shared public transport estimate', badge: 'Local estimate', amenities: ['Confirm current service locally'] },
      { id: `route-sample-auto-${from.id}`, origin: from.name, destination: to.name, route: `Local ride around ${from.name}`, type: 'Auto-rickshaw · sample estimate', mode: 'Auto', operator: 'Local operator information unavailable', duration: 'Route-dependent', distanceKm: distance, estimatedCost: 120, estimatedFare: 120, frequency: 'Availability varies', departureInfo: 'Confirm fare before travel', arrivalInfo: 'Route-dependent', bookingAvailable: false, ecoRating: 'Local shared ride estimate', badge: 'Local estimate', amenities: ['Agree on fare or meter before travel'] },
      { id: `route-sample-rental-${from.id}`, origin: from.name, destination: to.name, route: `Self-drive around ${from.name}`, type: 'Bike or car rental · sample estimate', mode: 'Rental', operator: 'Rental provider information unavailable', duration: 'Hourly or daily; provider terms vary', distanceKm: distance, estimatedCost: 500, estimatedFare: 500, frequency: 'Availability varies', departureInfo: 'Confirm license and deposit requirements', arrivalInfo: 'Return terms vary', bookingAvailable: false, ecoRating: 'Individual transport estimate', badge: 'Rental estimate', amenities: ['Confirm provider, insurance, and terms'] }
    );
  } else if (distance >= 300) {
    options.push({ id: `route-sample-flight-${from.id}-${to.id}`, origin: from.name, destination: to.name, route: `${from.name} to ${to.name}`, type: 'Flight connection · sample estimate', mode: 'Flight', operator: 'Airline and airport connections vary', duration: `${Math.max(1, Math.round(distance / 650))} hours in-air estimate; allow for airport time`, distanceKm: distance, estimatedCost: Math.max(3500, Math.round(distance * 5.5)), estimatedFare: Math.max(3500, Math.round(distance * 5.5)), frequency: 'Check current airline schedules', departureInfo: 'Flight schedule unavailable', arrivalInfo: 'Route-dependent', bookingAvailable: false, ecoRating: 'Compare with rail for lower-emission travel', badge: 'Sample fare estimate', amenities: ['Check live schedules and fares with airlines'] });
  }
  return options;
};
