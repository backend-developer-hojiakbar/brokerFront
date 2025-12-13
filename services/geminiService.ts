import { GoogleGenAI } from "@google/genai";
import type { TenderData, SerperSearchResult, Product, ContractData } from '../types';
import nlp from 'compromise';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

// Helper function to load backup content from localStorage
const loadFromBackup = async (url: string): Promise<string | null> => {
    try {
        // Try to find a backup copy in localStorage
        const keys = Object.keys(localStorage);
        const urlSlug = url.split('/').pop()?.split('?')[0] || '';
        
        for (const key of keys) {
            if (key.startsWith('tender_backup_') && key.includes(urlSlug)) {
                const content = localStorage.getItem(key);
                if (content) {
                    console.log(`Found backup copy for ${urlSlug}`);
                    return content;
                }
            }
        }
        
        console.log(`No backup copy found for ${url}`);
        return null;
    } catch (error) {
        console.warn("Error loading from backup:", error);
        return null;
    }
};

// Helper function to clean up old backups
const cleanupOldBackups = () => {
    try {
        const keys = Object.keys(localStorage);
        const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago
        
        for (const key of keys) {
            if (key.startsWith('tender_backup_')) {
                // Extract timestamp from key (format: tender_backup_{timestamp}_{filename})
                const parts = key.split('_');
                if (parts.length >= 3) {
                    const timestamp = parseInt(parts[2]);
                    if (!isNaN(timestamp) && timestamp < cutoffTime) {
                        localStorage.removeItem(key);
                        console.log(`Removed old backup: ${key}`);
                    }
                }
            }
        }
    } catch (error) {
        console.warn("Error cleaning up old backups:", error);
    }
};

export const generateRobustSearchQuery = (product: Product): string => {
    // Use Gemini's query if it's very specific, otherwise build a better one.
    if (product.searchQuery && product.searchQuery.length > product.name.length + 10) {
        return product.searchQuery;
    }

    const nameDoc = nlp(product.name);
    // Extract nouns, organizations (often brands), and values (like model numbers)
    const keyTerms = nameDoc.nouns().out('array');
    const orgs = nameDoc.organizations().out('array');
    const values = nameDoc.numbers ? nameDoc.numbers().out('array') : [];
    
    // Combine and uniqueify key terms from the name
    let queryParts = [...new Set([...keyTerms, ...orgs, ...values])];

    // Add 2-3 most important specifications (e.g., brand, model, key feature)
    const importantSpecKeys = ['brand', 'model', 'ishlab chiqaruvchi', 'модель', 'бренд', 'производитель'];
    const specValues: string[] = [];
    if (product.specifications) {
        for (const spec of product.specifications) {
            if (importantSpecKeys.some(is => spec.key.toLowerCase().includes(is))) {
                specValues.push(spec.value);
            }
        }
    }
    
    // Add up to 2 other important specs if we still have room
    if (product.specifications && specValues.length < 3) {
        for (const spec of product.specifications) {
            if (specValues.length >= 3) break;
            // Prioritize specs with alphanumeric values (likely model/part numbers)
            if (!specValues.includes(spec.value) && /\w/.test(spec.value) && /\d/.test(spec.value)) {
                 specValues.push(spec.value);
            }
        }
    }

    queryParts = [...queryParts, ...specValues];

    // Clean up parts: remove duplicates, short words, and trim whitespace
    const cleanedParts = queryParts
        .map(part => part.replace(/,/g, ' ').trim())
        .filter(part => part.length > 2); // Filter out very short, likely irrelevant parts

    return [...new Set(cleanedParts)].join(' ') + " narxi Toshkentda";
};


const tender_json_structure = `{
  "summary": "Tenderning qisqacha mazmuni.",
  "lotNumber": "Lot raqami.",
  "tenderName": "Tender (lot) nomi.",
  "customerName": "Buyurtmachi nomi.",
  "startingPrice": "Boshlang'ich narxi, valyutasi bilan birga.",
  "applicationDeadline": "Ariza topshirishning oxirgi muddati.",
  "winProbability": "G'olib bo'lish ehtimoli, 0 dan 100 gacha bo'lgan son. Narx, raqobat, mahsulotning noyobligi kabi omillarni hisobga oling.",
  "winProbabilityReasoning": "G'oliblik ehtimolini asoslovchi 2-3 ta eng muhim omilning qisqa, bandma-band ro'yxati (masalan, '* Narx raqobatchilardan pastroq\\n* Mahsulot spetsifikatsiyasi noyob').",
  "products": [
    {
      "name": "Mahsulotning lotdagi ASL NOMI (tarjima va o'zgartirishlarsiz).",
      "quantity": "Mahsulot miqdori va o'lchov birligi (dona, kg, litr).",
      "description": "Mahsulotning qisqacha tavsifi.",
      "price": "Birlik narxi (agar mavjud bo'lsa).",
      "imageUrl": "Mahsulot rasmining URL manzili (agar topilsa).",
      "dimensions": "O'lchamlari (masalan, '120x80x50 sm').",
      "weight": "Og'irligi (masalan, '15 kg').",
      "voltage": "Kuchlanishi (masalan, '220V').",
      "specifications": [
        { "key": "Texnik xususiyat nomi (masalan, 'Ishlab chiqaruvchi')", "value": "Xususiyat qiymati (masalan, 'O'zbekiston')" }
      ],
      "searchQuery": "Bozor narxini qidirish uchun eng optimal va qisqa qidiruv so'rovi (masalan, 'HP LaserJet Pro M404dn printer Toshkentda narxi'). Brend, model va eng muhim xususiyatlarni ishlating."
    }
  ]
}`;

const robustJsonParse = (text: string) => {
    // Attempt to find a JSON block enclosed in ```json ... ``` or ``` ... ```
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
    let jsonString: string;

    if (jsonMatch && jsonMatch[1]) {
        jsonString = jsonMatch[1].trim();
    } else {
        // Fallback for cases where there are no markdown backticks.
        // Find the first '{' or '[' and the last '}' or ']' to bound the JSON object/array.
        const firstBracket = text.indexOf('{');
        const firstSquare = text.indexOf('[');
        let firstIndex = -1;

        if (firstBracket > -1 && firstSquare > -1) {
            firstIndex = Math.min(firstBracket, firstSquare);
        } else if (firstBracket > -1) {
            firstIndex = firstBracket;
        } else {
            firstIndex = firstSquare;
        }

        const lastBracket = text.lastIndexOf('}');
        const lastSquare = text.lastIndexOf(']');
        let lastIndex = Math.max(lastBracket, lastSquare);
        
        if (firstIndex === -1 || lastIndex < firstIndex) {
            throw new Error(`Gemini API'dan to'g'ri formatdagi JSON javob olinmadi. Qaytgan javob: "${text.slice(0, 100)}..."`);
        }
        jsonString = text.substring(firstIndex, lastIndex + 1);
    }

    try {
        // Sanitize the string to remove unescaped control characters like tabs and newlines,
        // which are invalid in JSON strings and can cause parsing errors.
        // Replacing them with a space is a safe way to fix the syntax.
        let sanitizedJsonString = jsonString.replace(/[\t\r\n]/g, ' ');
        
        // Handle extremely long strings that might cause parsing issues
        // Truncate very long description fields that might contain unescaped quotes
        sanitizedJsonString = sanitizedJsonString.replace(/("description"\s*:\s*")([^"]{2000,}?)(")/g, function(match, prefix, content, suffix) {
            // Truncate long descriptions to prevent parsing issues
            const truncated = content.substring(0, 1000) + '... (truncated by parser)';
            return prefix + truncated + suffix;
        });
        
        // More aggressive quote escaping for complex cases
        // Escape quotes that appear to be inside string values
        sanitizedJsonString = sanitizedJsonString.replace(/(:\s*"[^"]*)"([^"]*")/g, function(match, prefix, suffix) {
            // Check if this looks like an unescaped quote inside a string value
            // Count quotes before this point to see if we're inside a string
            const beforeMatch = sanitizedJsonString.substring(0, sanitizedJsonString.indexOf(match));
            const quoteCount = (beforeMatch.match(/"/g) || []).length;
            
            // If we're inside a string value (odd number of quotes before this point)
            if (quoteCount % 2 === 1) {
                // Escape the quote
                return prefix + '\\"' + suffix;
            }
            return match;
        });
        
        // Fix any remaining unescaped quotes in string values
        let fixedJson = '';
        let inString = false;
        let escaped = false;
        
        for (let i = 0; i < sanitizedJsonString.length; i++) {
            const char = sanitizedJsonString[i];
            
            if (char === '\\' && !escaped) {
                escaped = true;
                fixedJson += char;
                continue;
            }
            
            if (char === '"' && !escaped) {
                // Toggle string state
                inString = !inString;
                fixedJson += char;
            } else if (char === '"' && inString && !escaped) {
                // This is an unescaped quote inside a string, escape it
                fixedJson += '\\"';
            } else {
                fixedJson += char;
            }
            
            if (char !== '\\') {
                escaped = false;
            }
        }
        
        sanitizedJsonString = fixedJson;
        
        return JSON.parse(sanitizedJsonString);
    } catch (parseError) {
        console.error("Failed to parse JSON string:", jsonString);
        console.error("Sanitized JSON string:", jsonString.replace(/[\t\r\n]/g, ' '));
        throw new Error(`Gemini API'dan kelgan javobni JSON formatiga o'girishda xatolik yuz berdi. Batafsil: ${parseError.message}`);
    }
}

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result.split(',')[1]);
            } else {
                reject(new Error("Faylni base64 formatiga o'girib bo'lmadi."));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

const SCRAPER_API_KEY = '1406eb153985cd50ef60a4f9f1e9c8c6';

export const fetchPageContent = async (url: string): Promise<string> => {
    if (!SCRAPER_API_KEY) {
        throw new Error("ScraperAPI kaliti o'rnatilmagan.");
    }
    
    // Try multiple approaches to fetch the page content
    const approaches = [
        // Primary: ScraperAPI with full rendering
        () => fetchScraperAPI(url, true),
        // Secondary: ScraperAPI without rendering (faster)
        () => fetchScraperAPI(url, false),
        // Fallback: Direct fetch with browser-like headers
        () => fetchDirect(url)
    ];
    
    for (let i = 0; i < approaches.length; i++) {
        try {
            console.log(`Attempting approach ${i + 1} to fetch ${url}`);
            const html = await approaches[i]();
            if (html && html.trim() !== '') {
                console.log(`Successfully fetched content using approach ${i + 1}`);
                return html;
            }
        } catch (err) {
            console.warn(`Approach ${i + 1} failed for ${url}:`, err);
            // Continue to next approach
        }
    }
    
    throw new Error(`Barcha usullar yordamida sahifani yuklab bo'lmadi: ${url}`);
};

const fetchScraperAPI = async (url: string, render: boolean): Promise<string> => {
    const scraperUrl = `https://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(url)}&render=${render}&country_code=uz&premium=true&timeout=40000`;
    const response = await fetch(scraperUrl);
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ScraperAPI xizmati xatolik qaytardi: ${response.status} - ${errorText}`);
    }
    const html = await response.text();
    if (!html || html.trim() === '') {
        throw new Error("ScraperAPI xizmati bo'sh javob qaytardi.");
    }
    return html;
};

const fetchDirect = async (url: string): Promise<string> => {
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
    });
    if (!response.ok) {
        throw new Error(`Direct fetch failed: ${response.status} - ${response.statusText}`);
    }
    return await response.text();
};


export const processTenderUrl = async (mainUrl: string, additionalUrls: string[], files: File[], contractHistory: ContractData[]): Promise<TenderData> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY muhit o'zgaruvchisi o'rnatilmagan.");
  }
  
  // Clean up old backups periodically
  cleanupOldBackups();

  let effectiveFiles = [...files]; // Start with user-provided files

  const hasManuallyUploadedHtmlFile = files.some(f => f.type === 'text/html' || f.name.endsWith('.html') || f.name.endsWith('.htm'));

  // If no HTML file is manually uploaded, try to fetch it automatically
  if (!hasManuallyUploadedHtmlFile && mainUrl) {
      try {
          console.log("HTML fayl topilmadi, asosiy URL'dan avtomatik yuklanmoqda...");
          const htmlContent = await fetchPageContent(mainUrl);
          const urlSlug = mainUrl.split('/').pop()?.split('?')[0] || 'fetched-page';
          const fileName = `${urlSlug.replace(/[^a-zA-Z0-9-]/g, '-')}.html`;
          const fetchedFile = new File([htmlContent], fileName, { type: 'text/html' });
          effectiveFiles.push(fetchedFile);
          console.log(`"${fileName}" fayli muvaffaqiyatli yaratildi va tahlilga qo'shildi.`);
          
          // Save a backup copy to localStorage for offline access
          try {
              const backupKey = `tender_backup_${Date.now()}_${fileName}`;
              localStorage.setItem(backupKey, htmlContent);
              console.log(`Backup copy saved to localStorage with key: ${backupKey}`);
          } catch (storageError) {
              console.warn("Could not save backup copy to localStorage:", storageError);
          }
      } catch (fetchError) {
          console.warn("Asosiy URL'ni avtomatik yuklashda xatolik yuz berdi:", fetchError);
          // Try to load from backup if available
          const backupContent = await loadFromBackup(mainUrl);
          if (backupContent) {
              const urlSlug = mainUrl.split('/').pop()?.split('?')[0] || 'fetched-page';
              const fileName = `${urlSlug.replace(/[^a-zA-Z0-9-]/g, '-')}.html`;
              const backupFile = new File([backupContent], fileName, { type: 'text/html' });
              effectiveFiles.push(backupFile);
              console.log(`Loaded backup copy for "${fileName}"`);
          } else {
              // Don't throw an error, proceed with just URLs if fetching fails.
              // The AI might still be able to get something with Google Search as a last resort.
          }
      }
  }


  const allUrls = [mainUrl, ...additionalUrls].filter(u => u && u.trim() !== '');
  const uniqueUrls = [...new Set(allUrls)];
  const urlListString = uniqueUrls.length > 0 ? uniqueUrls.join('\n') : "URL manzillar ro'yxati bo'sh.";
  
    // --- Platform-Specific Instructions ---
    let platformName = "Umumiy";
    let platformSpecificInstructions = "";

    const UZEX_INSTRUCTIONS = `
1.  **MAHSULOT BLOKLARINI TOPISH:** Bu saytda mahsulotlar ko'pincha \`<table>\` ichida emas, balki alohida \`<div>\` bloklarida keladi. Sahifani skaner qilib, har bir mahsulotni o'z ichiga olgan asosiy blokni top. Bu blok odatda "lot-item-card", "product-description" yoki shunga o'xshash class nomiga ega bo'lishi mumkin.
2.  **HAR BIR BLOKNI TAHLIL QILISH:** Har bir topilgan mahsulot bloki ichidan quyidagilarni izla:
    *   **Nomi:** "Mahsulot (tovar) nomi", "Наименование товара (работы, услуги)" kabi yozuvlar yonidagi matnni O'ZGARTIRMASDAN ol.
    *   **Miqdori:** "Soni/Miqdori", "Количество" yozuvlari yonidan miqdorni va o'lchov birligini top.
    *   **Xususiyatlari:** "Texnik xususiyatlari", "Технические параметры" kabi bo'limlardagi barcha ma'lumotlarni \`specifications\` massiviga \`{key, value}\` formatida to'liq yig'.
3.  **DIQQAT (O'TA MUHIM):** "O‘xshash lotlar" yoki "Tavsiya etilgan mahsulotlar" kabi bloklardan HECH QACHON ma'lumot olma. Faqat asosiy, tahlil qilinayotgan lotning o'ziga tegishli mahsulotlarni ajratib ol. Bu xato butun tahlilni noto'g'ri qilib qo'yadi.
`;

    const XTXARID_INSTRUCTIONS = `
1.  **ASOSIY JADVALNI ANIQLASH:** Sening birinchi vazifang - hujjat ichidan mahsulotlar ro'yxati keltirilgan ASOSIY JADVALNI (\`<table>\`) topish. Bu jadval odatda "Наименование товара", "Mahsulot nomi", "Количество", "Miqdori" kabi sarlavhalarga ega bo'ladi.
2.  **HAR BIR QATORNI O'RGANISH:** Jadvaldagi har bir mahsulot qatorini (\`<tr>\`) birma-bir tahlil qil.
3.  **NOMINI XATOSIZ OLISH:** "Наименование товара" (yoki shunga o'xshash) ustunidan mahsulot nomini top. Uni QANDAY YOZILGAN BO'LSA, XUDDI SHUNDAY, O'ZGARTIRMASDAN, TARJIMA QILMASDAN \`name\` maydoniga ko'chir.
4.  **MIQDORNI TOPISH:** Shu qator ichidan "Количество", "Miqdori" ustunini topib, qiymatini ol. **HECH QACHON MAHSULOT KODIDAN (masalan, \`20.41.32.119_00014\`) MIQDOR SIFATIDA FOYDALANMA!**
5.  **XUSUSIYATLARNI YIG'ISH:** Mahsulot tavsifidagi yoki jadvaldagi QOLGAN BARCHA ma'lumotlarni \`specifications\` massiviga to'liq yig'. HECH NARSANI QOLDIRMA.
`;
    
    if (mainUrl.includes('uzex.uz')) {
        platformName = "ETENDER.UZEX.UZ";
        platformSpecificInstructions = UZEX_INSTRUCTIONS;
    } else if (mainUrl.includes('xt-xarid.uz')) {
        platformName = "XT-XARID.UZ";
        platformSpecificInstructions = XTXARID_INSTRUCTIONS;
    }


  const contextPrompt = `SEN TENDER MA'LUMOTLARINI AJRATIB OLISHGA IXTISOSLASHGAN EKSPERTSAN.

**MA'LUMOT MANBALARI:**
Sening ixtiyoringda ikkita asosiy ma'lumot manbasi bor:
1.  **BIRLAMCHI MANBA (Ilova qilingan Fayllar):** Bular sahifaning saqlangan nusxalari (HTML) yoki tenderga oid hujjatlar (PDF, DOCX) bo'lishi mumkin. Agar ilova qilingan HTML faylda to'liq ma'lumot mavjud bo'lsa, uni ASOSIY MANBA sifatida ishlat.
2.  **IKKILAMCHI MANBA (Jonli URL manzillar va Google Search):** Agar fayllardagi ma'lumotlar to'liq bo'lmasa, Google Search vositasidan foydalanib, ushbu URL manzillarning JONLI versiyasidan ma'lumotlarni top va fayldagi ma'lumotlarni to'ldir.

**URL MANZILLAR RO'YXATI:**
${urlListString}

**${platformName} UCHUN MAXSUS QO'LLANMA:**
${platformSpecificInstructions}

**ASOSIY PRINSIP:** Muvaffaqiyatli tahlil uchun har doim eng to'liq va aniq ma'lumotga ega bo'lgan manbaga tayan. Agar fayl va jonli URL bir-biriga zid bo'lsa, odatda jonli URL'dagi ma'lumot to'g'riroq bo'ladi. Agar ikkala manba ham natija bermasa, "summary" maydoniga "Xatolik: Taqdim etilgan manbalardan tender ma'lumotlarini ajratib olib bo'lmadi." deb yoz.

Yuqoridagi manbalarni va maxsus qo'llanmani sinchkovlik bilan tahlil qilib, quyida so'ralgan vazifalarni bajaring:`;
  
  let contractContextPrompt = '';
    if (contractHistory && contractHistory.length > 0) {
        const simplifiedContracts = contractHistory
            .filter(c => c.products && c.products.length > 0)
            .map(c => ({
                contractNumber: c.contractNumber,
                contractDate: c.contractDate,
                customerName: c.parties.customer,
                products: c.products!.map(p => ({ 
                    name: p.name, 
                    quantity: p.quantity, 
                    price: p.price 
                }))
            }));
        
        if (simplifiedContracts.length > 0) {
            contractContextPrompt = `
**MAVJUD TAJRIBA BAZASI (AVVAL YUTILGAN SHARTNOMALAR):**
Quyida avval tahlil qilingan va yutilgan shartnomalar ro'yxati keltirilgan. Hozirgi tenderdagi mahsulotlarni ushbu baza bilan solishtir. Agar o'xshash mahsulot topsang, o'sha shartnomadagi narxni va shartnoma raqamini bozor narxini aniqlashda muhim ma'lumot sifatida hisobga ol va o'z xulosangda buni qayd et.

**SHARTNOMALAR BAZASI:**
\`\`\`json
${JSON.stringify(simplifiedContracts, null, 2)}
\`\`\`
---
`;
        }
    }

  const promptText = `${contractContextPrompt}${contextPrompt}

**SUPER-KRITIK BIRINCHI QADAM: MAHSULOTLARNI TO'G'RI TOPISH VA NOMLARNI XATOSIZ AJRATISH**
Platforma uchun maxsus qo'llanmaga amal qilgan holda, mahsulotlarni top.
1.  **NOMINI ANIQLIK BILAN OL:** Mahsulot nomini QANDAY YOZILGAN BO'LSA, XUDDI SHUNDAY, O'ZGARTIRMASDAN, TARJIMA QILMASDAN \`name\` maydoniga ko'chir. Bu eng muhim qism.
2.  **NOMNI TEKSHIR:** Nomni olganingdan so'ng, u haqiqatdan ham mahsulot yoki xizmat nomi ekanligiga ishonch hosil qil. U "Umumiy summa" yoki "Jami" kabi yakuniy qator bo'lmasligi kerak.
3.  **KEYINGI QADAMLAR:** Faqat va faqat nomni to'g'ri aniqlaganingdan so'ng, o'sha mahsulot uchun miqdor, xususiyatlar va boshqa ma'lumotlarni qidirishni boshla.

**BOZOR NARXINI QIDIRISH UCHUN ENG YAXSHI SO'ROVNI YARATISH (\`searchQuery\`)**
Har bir mahsulot uchun narxni eng aniq topadigan qidiruv so'rovini yarat. Bu uchun yuqorida to'plangan texnik xususiyatlardan foydalan.
1.  **Brend va Modelni ol:** "Ноутбук HP Pavilion 15".
2.  **Narxga Eng Kuchli Ta'sir Qiluvchi 2-4 ta Muhim Xususiyatni Qo'sh:** "Core i5", "16GB RAM", "512GB SSD", "RTX 3050". Xususiyatlar qanchalik noyob bo'lsa, ularni qo'shish shunchalik muhim.
3.  **Aniqlovchi So'zlarni Qo'sh:** "narxi Toshkentda" yoki "sotib olish".
4.  **Natija:** "Ноутбук HP Pavilion 15 Core i5 16GB RAM 512GB SSD RTX 3050 narxi Toshkentda".
5.  **Yomon misol:** "Ноутбук sotib olish 1 yil kafolat билан" (Bu noto'g'ri, narx topishga yordam bermaydi, chunki texnik xususiyatlar yo'q).

**STRATEGIK TAHLIL: G'OLIBLIK EHTIMOLINI BASHORAT QILISH**
Barcha ma'lumotlarni umumlashtirib, ushbu tenderda g'olib chiqish ehtimolini (0-100% oralig'ida) bashorat qil va o'z xulosangni asoslab ber.
1.  **Ehtimolni Hisoblash (\`winProbability\`):** Quyidagi omillarni inobatga ol:
    *   **Narx Ustunligi:** Tenderning boshlang'ich narxi qanchalik jozibador? Agar avvalgi shartnomalar bazasi (\`MAVJUD TAJRIBA BAZASI\`) mavjud bo'lsa, o'xshash mahsulotlar uchun narxlar qanday bo'lgan?
    *   **Mahsulotning Noyobligi:** Tenderdagi mahsulotlar va ularning texnik xususiyatlari qanchalik noyob? Agar mahsulotlar ommabop bo'lsa, raqobat yuqori bo'ladi (ehtimol pastroq). Agar xususiyatlar juda spesifik bo'lsa, raqobat kamroq bo'ladi (ehtimol yuqoriroq).
    *   **Ma'lumotlarning To'liqligi:** Hujjatlarda ma'lumotlar qanchalik to'liq va aniq? Noaniqliklar riskni oshiradi (ehtimol pastroq).
2.  **Sabablarni Asoslash (\`winProbabilityReasoning\`):** O'z bashoratingni 2-3 ta eng muhim sabab bilan qisqa bandlar (Markdown formatida \`* Sabab 1\\n* Sabab 2\`) ko'rinishida tushuntir. Masalan: "* Boshlang'ich narx bozor narxidan 15% past.\\n* Texnik talablar juda spesifik bo'lgani uchun raqobatchilar soni kam bo'lishi kutilmoqda."

**MUHIM YAKUNIY QOIDA:** Yuqoridagi barcha qoidalarga qat'iy rioya qil. Agar biror sababga ko'ra (masalan, fayl bo'sh, ma'lumot yetarli emas, tahlil qilish imkonsiz) so'ralgan ma'lumotlarni to'liq ajratib olishning iloji bo'lmasa, HECH QACHON oddiy matn bilan javob BERMA. Buning o'rniga, topa olgan ma'lumotlaringiz bilan JSON strukturasini to'ldir, topilmagan maydonlarni bo'sh qoldir (\`""\` yoki \`[]\`) va \`summary\` maydoniga "Tahlil qilishda xatolik: [xatoning qisqacha tavsifi]" deb yoz. ASOSIY MAQSAD - HAR QANDAY VAZIYATDA BELGILANGAN JSON FORMATIDA JAVOB QAYTARISH.

**O'TA MUHIM JSON QOIDASI:** JSON ichidagi barcha matnli maydonlarda ("summary", "name", "description" va hokazo) qo'shtirnoq (") belgisini ishlatsangiz, uni har doim teskari slesh (\\) bilan ekranlang. Masalan, "description": "Mahsulot \\"Zo'r\\" deb nomlanadi". Bu JSON sintaksisining buzilmasligi uchun juda muhim.

Javobni quyidagi JSON strukturasida, HECH QANDAY IZOHSIZ, faqat \`\`\`json ... \`\`\` bloki ichida qaytar:
${tender_json_structure}`;

    const fileParts = await Promise.all(
        effectiveFiles.map(async (file) => {
            const base64Data = await blobToBase64(file);
            return {
                inlineData: {
                    mimeType: file.type,
                    data: base64Data,
                },
            };
        })
    );
    
    const promptParts = [{ text: promptText }, ...fileParts];


  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: promptParts },
      config: {
        tools: [{googleSearch: {}}]
      }
    });

    const parsedData = robustJsonParse(response.text);
    return parsedData as TenderData;
  } catch (error) {
    console.error("Error processing tender URL with Gemini:", error);
    
    // Provide more specific error messages based on the type of error
    if (error instanceof Error) {
        if (error.message.includes('API key not valid')) {
            throw new Error("API kaliti noto'g'ri. Iltimos, sozlamalarni tekshiring.");
        } else if (error.message.includes('Access Denied') || error.message.includes('Forbidden')) {
            throw new Error("Taqdim etilgan manbalardan tender ma'lumotlarini ajratib olib bo'lmadi. URL manzilga kirish imkoni yo'q ('Access Denied' yoki 'Error loading data'). Sayt avtomatik so'rovlarni blokirovka qilishi mumkin. Iltimos, sahifani ko'chirib oling va fayl sifatida yuklang.");
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            throw new Error("Tender ma'lumotlarini tahlil qilishda tarmoq xatoligi yuz berdi. Internet ulanishingizni tekshiring yoki birozdan so'ng qayta urinib ko'ring.");
        } else {
            throw error;
        }
    }
    
    throw new Error("Tender ma'lumotlarini tahlil qilishda noma'lum xatolik yuz berdi.");
  }
};

const SERPER_API_KEY = '26d2f1533a649f0a578acfa82283b9e549c9edc1';
const SEARCH_REGIONS = ['uz', 'kz', 'kg', 'tj', 'tm', 'cn'];

export const searchOnSerper = async (query: string): Promise<Record<string, SerperSearchResult[]>> => {
    const allResults: Record<string, SerperSearchResult[]> = {};

    const searchPromises = SEARCH_REGIONS.map(async (region) => {
        const data = JSON.stringify({
            q: query,
            gl: region,
            hl: "uz"
        });

        try {
            const response = await fetch('https://google.serper.dev/search', {
                method: 'POST',
                headers: {
                    'X-API-KEY': SERPER_API_KEY,
                    'Content-Type': 'application/json'
                },
                body: data
            });

            if (!response.ok) {
                console.error(`Serper API xatosi (${region}): ${response.status}`);
                return;
            }

            const responseData = await response.json();
            if (responseData.organic && responseData.organic.length > 0) {
                allResults[region] = responseData.organic;
            }
        } catch (error) {
            console.error(`Serper qidiruvida xatolik (${region}):`, error);
        }
    });

    await Promise.all(searchPromises);

    if (Object.keys(allResults).length === 0) {
         throw new Error("Barcha hududlar bo'yicha bozor narxini qidirishda xatolik yuz berdi.");
    }

    return allResults;
};

export const searchByImageOnSerper = async (imageUrl: string, query: string): Promise<Record<string, SerperSearchResult[]>> => {
    const allResults: Record<string, SerperSearchResult[]> = {};

    const searchPromises = SEARCH_REGIONS.map(async (region) => {
        const data = JSON.stringify({
            q: query,
            imageUrl: imageUrl,
            gl: region,
            hl: "uz"
        });
        
        try {
            const response = await fetch('https://google.serper.dev/images', {
                method: 'POST',
                headers: {
                    'X-API-KEY': SERPER_API_KEY,
                    'Content-Type': 'application/json'
                },
                body: data
            });

            if (!response.ok) {
                console.error(`Serper API xatosi (rasm, ${region}): ${response.status}`);
                return;
            }

            const responseData = await response.json();
            if (responseData.images && responseData.images.length > 0) {
                allResults[region] = (responseData.images || []).map((img: any, index: number): SerperSearchResult => ({
                    title: img.title,
                    link: img.link,
                    snippet: `Manba: ${img.source}`,
                    position: index + 1,
                }));
            }
        } catch (error) {
            console.error(`Serper rasm qidiruvida xatolik (${region}):`, error);
        }
    });
    
    await Promise.all(searchPromises);
    
    if (Object.keys(allResults).length === 0) {
        throw new Error("Barcha hududlar bo'yicha bozor narxini rasm orqali qidirishda xatolik yuz berdi.");
    }
    
    return allResults;
};


export const extractPriceFromUrl = async (product: Product, url: string): Promise<number> => {
    const json_structure = `{"price": <number>, "found": <boolean>, "reasoning": "<string>"}`;
    const specificationsText = product.specifications && product.specifications.length > 0
        ? `**TEXNIK XUSUSIYATLARI:**\n${product.specifications.map(s => `- ${s.key}: ${s.value}`).join('\n')}`
        // The starting price for one unit.
    : '';
    const startingPriceText = product.price 
        ? `${product.price}`
        : `Noma'lum`;
    
    const prompt = `SEN: "G'olib Narx Qidiruvchi" agentsan, e-commerce saytlaridan narx ajratib olish bo'yicha yuqori malakali mutaxassis.
Sening ASOSIY MAQSADING: Berilgan MAHSULOT uchun uning LOTDAGI BOSHLANG'ICH NARXIDAN ANIQ ARZONROQ bo'lgan HAQIQIY BOZOR NARXINI topish.

**KONTEKST (O'TA MUHIM):**
- **MAHSULOT:** "${product.name}"
${specificationsText}
- **MAKSIMAL NARX (Lotdagi boshlang'ich narx):** ${startingPriceText} <-- BU CHEGARA!

**TAHLIL QILINADIGAN URL MANZIL:** ${url}

**QAT'IY G'OLIBLIK STRATEGIYASI:**
1.  **NARX ELEMENTLARINI QIDIR:** Sahifada narxni topish uchun quyidagi belgilarga e'tibor ber:
    - Raqamlar bilan birga kelgan "so'm", "сум", "UZS" kabi valyuta belgilari.
    - \`price\`, \`product-price\`, \`amount\`, \`cost\` kabi class yoki id'larga ega HTML elementlari.
    - Ko'pincha narxlar \`<strong>\`, \`<b>\`, \`<span>\` teglari ichida bo'ladi.
2.  **CHEGIRMALARNI INOBATGA OL:** Agar sahifada eski narx (chizilgan) va yangi chegirmali narx bo'lsa, HAR DOIM YANGI, ARZON NARXNI ol. Bu bizning ustunligimiz.
3.  **"SOTUVDA YO'Q" HOLATINI ANIQLA:** Agar mahsulot "sotuvda yo'q", "нет в наличии", "out of stock" deb belgilangan bo'lsa, narxni qidirmasdan, "found": false va "reasoning": "Mahsulot sotuvda yo'q" deb qaytar.
4.  **MANTIQIY FILTR:**
    - Agar topilgan narx "MAKSIMAL NARX"dan yuqori bo'lsa, bu biz uchun foydasiz. "found": false, "price": 0, "reasoning": "Topilgan narx lotdagi boshlang'ich narxdan yuqori." deb qaytar.
    - Agar topgan narxing "MAKSIMAL NARX"dan KESKIN (5-10 baravar) past bo'lsa, bu xato bo'lishi mumkin (masalan, aksessuar narxi). Buni "reasoning"da tushuntirib, "found": false, "price": 0 deb qaytar.
5.  **TO'G'RI NARXNI AJRATISH:** Faqat mahsulotning o'zini narxini ol. Yetkazib berish, kredit kabi qo'shimcha xarajatlarni hisobga OLMA. Javobingni har doim O'ZBEKISTON SO'MIDA qaytar.

**JAVOB FORMATI (MAJBURIY):**
Natijani faqat va faqat quyidagi JSON formatida, \`\`\`json ... \`\`\` bloki ichida, hech qanday izohsiz qaytar:
${json_structure}

**O'TA MUHIM JSON QOIDASI:** "reasoning" maydoni ichidagi barcha qo'shtirnoq (") belgilarini to'g'ri ekranlash (\\") shart. Masalan, "reasoning": "Mahsulot \\"Zo'r\\" deb nomlanadi".`;

    const apiCall = async () => {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ text: prompt }],
            config: {
                tools: [{ googleSearch: {} }],
            },
        });
        
        const result = robustJsonParse(response.text);

        if (result && result.found && typeof result.price === 'number') {
            return result.price;
        }
        
        console.warn(`Price not found or invalid format for ${url}. Reasoning: ${result?.reasoning || 'No reasoning provided.'}`);
        return 0;
    };

    const retries = 3;
    for (let i = 0; i < retries; i++) {
        try {
            const price = await apiCall();
            // Add a 1-second delay between successful calls to stay under the limit
            await delay(1000); 
            return price;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            // Check for rate limit error (429) or resource exhausted
            if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
                const backoffTime = 2000 * Math.pow(2, i); // Exponential backoff: 2s, 4s, 8s
                console.warn(`Rate limit hit for ${url}. Retrying in ${backoffTime / 1000}s... (Attempt ${i + 1}/${retries})`);
                await delay(backoffTime);
            } else {
                // It's a different, non-retryable error
                console.error(`Error extracting price from ${url} (non-retryable):`, error);
                return 0; // Stop retrying and return 0
            }
        }
    }

    console.error(`Failed to extract price from ${url} after ${retries} retries due to rate limiting.`);
    return 0; // Return 0 after all retries fail
};

const contract_json_structure = `{
  "summary": "Shartnomaning umumiy mazmuni va asosiy maqsadi haqida 2-3 gapdan iborat xulosa.",
  "parties": { "customer": "Buyurtmachi (tashkilotning to'liq nomi va rekvizitlari).", "supplier": "Yetkazib beruvchi/Ijrochi (tashkilotning to'liq nomi va rekvizitlari)." },
  "contractNumber": "Shartnoma raqami.",
  "contractDate": "Shartnoma tuzilgan sana.",
  "subject": "Shartnoma predmeti (nima haqida ekanligi).",
  "totalValue": "Shartnomaning umumiy summasi, valyutasi bilan birga.",
  "paymentTerms": ["To'lov shartlari (avans, to'lov muddati va tartibi bo'yicha eng muhim bandlar ro'yxati)."],
  "deliveryTerms": ["Mahsulotni yetkazib berish yoki ishlarni bajarish shartlari va muddatlari bo'yicha eng muhim bandlar ro'yxati."],
  "penalties": ["Tomonlarning majburiyatlarni bajarmaganlik uchun javobgarligi, penya va jarimalar haqidagi asosiy bandlar ro'yxati."],
  "warranty": "Kafolat muddati va shartlari.",
  "risks": ["Ijrochi uchun eng yuqori riskli 2-3 ta asosiy shartning qisqa ro'yxati."],
  "governingLaw": "Amal qiluvchi qonunchilik va nizolarni hal qilish tartibi.",
  "forceMajeure": "Fors-major holatlari haqidagi bandning qisqacha mazmuni.",
  "complianceCheck": {
    "status": "'success' (agar shartnoma standart va adolatli bo'lsa), 'warning' (agar kichik noaniqliklar yoki noqulay shartlar bo'lsa), 'critical' (agar jiddiy xavflar yoki adolatsiz shartlar bo'lsa).",
    "notes": ["Ijrochi uchun noqulay, noaniq yoki O'zbekistonning standart davlat xaridlari shartnomalaridan farq qiladigan bandlar haqida aniq, faktlarga asoslangan izohlar ro'yxati."]
  },
  "recommendations": ["Ijrochi shartnomani imzolashdan oldin qanday o'zgartirishlar kiritishni so'rashi kerakligi, qaysi bandlarga aniqlik kiritish lozimligi va muzokaralarda nimalarga e'tibor berish kerakligi haqida amaliy maslahatlar ro'yxati."],
  "products": [
    {
      "name": "Shartnomada ko'rsatilgan mahsulotning aniq nomi.",
      "quantity": "Mahsulot miqdori va o'lchov birligi.",
      "price": "Shartnomada kelishilgan birlik narxi.",
      "description": "Mahsulotning qisqacha tavsifi (agar mavjud bo'lsa)."
    }
  ]
}`;

export const analyzeContracts = async (file: File): Promise<ContractData> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY muhit o'zgaruvchisi o'rnatilmagan.");
    }

    const promptText = `SEN O'ZBEKISTONNING DAVLAT XARIDLARI BO'YICHA YUQORI MALAKALI EKSPERT YURISTSAN. SENING VAZIFANG - SHUNCHAKI MA'LUMOTNI AJRATIB OLISH EMAS, BALKI YETKAZIB BERUVCHI (IJROCHI) MANFAATLARINI HIMOYA QILISH NUQTAI NAZARIDAN CHUQUR TAHLILIY XULOSA BERISH.

Taqdim etilgan shartnoma hujjatini (PDF, DOC, DOCX) tahlil qil. Quyidagi vazifalarni bajar:
1.  **Asosiy ma'lumotlarni ajratib ol:** Tomonlar, summa, muddatlar kabi asosiy rekvizitlarni top.
2.  **Ijrochi uchun risklarni bahola:** To'lovning kechikishiga olib kelishi mumkin bo'lgan shartlar, bir tomonlama jarimalar, noaniq majburiyatlar va boshqa noqulay shartlarni aniqla.
3.  **Standartlarga muvofiqlikni tekshir:** Ushbu shartnomani O'zbekistondagi standart davlat xaridlari amaliyoti bilan solishtir. Sezilarli og'ishlarni, g'ayrioddiy bandlarni 'complianceCheck' bo'limida aniq ko'rsat.
4.  **Amaliy tavsiyalar ber:** Ijrochi shartnomani imzolashdan oldin qanday o'zgartirishlar kiritishi kerakligini aniq ko'rsat. 'recommendations' maydoniga muzokaralar uchun ANIQ, AMALIY maslahatlar ber. Misol: "'4.2-bandni '30 bank kuni ichida to'lov' o'rniga 'akt imzolangandan keyin 15 kalendar kuni ichida to'lov' deb o'zgartirishni so'rang." kabi konkret takliflar ber.
5.  **Mahsulotlarni aniqlash (AGAR MAVJUD BO'LSA):** Shartnoma ilovalaridan (spetsifikatsiya, texnik topshiriq) mahsulotlar ro'yxatini, ularning miqdori va kelishilgan narxini ajratib oling. Bu ma'lumot kelajakdagi tahlillar uchun baza bo'lib xizmat qiladi. Agar mahsulot haqida ma'lumot topilmasa, 'products' maydonini bo'sh massiv \`[]\` sifatida qoldir.

**O'TA MUHIM JSON QOIDASI:** JSON ichidagi barcha matnli maydonlarda ("summary", "notes", "recommendations" va hokazo) qo'shtirnoq (") belgisini ishlatsangiz, uni har doim teskari slesh (\\) bilan ekranlang. Masalan, "summary": "Shartnoma \\"Asosiy\\" deb nomlanadi". Bu JSON sintaksisining buzilmasligi uchun juda muhim.

Natijalarni tahlil qilib, ularni quyida berilgan JSON formatida tuzib chiq. Javobingni har doim \`\`\`json ... \`\`\` bloki ichida, faqat JSON obyektining o'zini joylashtirib bering. JSONdan oldin yoki keyin hech qanday izoh yozmang. Majburiy javob formati:
${contract_json_structure}`;
    
    const base64Data = await blobToBase64(file);
    const filePart = {
        inlineData: {
            mimeType: file.type,
            data: base64Data,
        },
    };
    
    const promptParts = [{ text: promptText }, filePart];

    try {
        // Fix: Added responseMimeType to ensure JSON output as requested by the prompt.
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: promptParts },
            config: {
                responseMimeType: 'application/json',
            }
        });
        
        const parsedData = robustJsonParse(response.text);
        return parsedData as ContractData;
    } catch (error) {
        console.error("Error processing contracts with Gemini:", error);
        if (error instanceof Error && error.message.includes('API key not valid')) {
            throw new Error("API kaliti noto'g'ri. Iltimos, sozlamalarni tekshiring.");
        }
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("Shartnoma ma'lumotlarini tahlil qilishda noma'lum xatolik yuz berdi.");
    }
};

// --- TELEGRAM SERVICE ---
const BOT_TOKEN = '8306231369:AAG65vVD9iN73PR8qhjUNd0_Z0YmEOqz9EI';
const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

export const sendTelegramMessage = async (chatId: string, message: string): Promise<void> => {
    if (!chatId || !message) {
        console.error("Telegram chat ID or message is empty.");
        return;
    }

    try {
        const response = await fetch(TELEGRAM_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML',
                disable_web_page_preview: true,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Telegram API error: ${data.description || 'Unknown error'}`);
        }

        console.log("Telegram message sent successfully.");

    } catch (error) {
        console.error("Failed to send Telegram message:", error);
        // Do not re-throw, as this should not block the main application flow.
    }
};