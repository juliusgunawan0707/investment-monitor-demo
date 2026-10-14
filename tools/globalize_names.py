"""
Globalize the synthetic company names and company-PIC names in data/*.json.

Why: the first generator (make_demo_data.py) produced "PT <word> <word> <word>" for every
company. The demo should look international: legal forms and naming style follow the company's
"Asal Negara" (Japan -> Co., Ltd./K.K., UAE -> LLC/FZE, USA -> Inc./LLC, ...), and the company PIC
is a person with a name that fits that country. Indonesian companies keep their names but get a
mix of PT / PT ... Tbk / CV; Yayasan stay as they are (foreign foundations become "<Word> Foundation").

Everything is invented. Deterministic (fixed seed). Writes tools/name_map.json (old -> new) so the
rewrite can be audited. Run ONCE on the generated data: it refuses to run if name_map.json exists.
Facilitation-team staff ("Nama PIC") are internal staff and are left untouched.

Run with:  python tools/globalize_names.py
"""
import json, os, random, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")
MAP_PATH = os.path.join(ROOT, "tools", "name_map.json")
FILES = ["dashboard.json", "kontribusi.json", "analytics.json", "i18n_data.json", "peta.json"]

rnd = random.Random(20261014)

# descriptor words by sector (source language of the data = Indonesian sector names)
DESC = {
    "Perhotelan": ["Hospitality", "Hotels", "Resorts"],
    "Pendidikan": ["Education", "Academy", "Learning"],
    "Kesehatan": ["Health", "Medical", "Care"],
    "Perkantoran": ["Properties", "Development", "Workspaces"],
    "Ritel & Perdagangan": ["Retail", "Trading", "Commerce"],
    "Hunian": ["Residences", "Homes", "Living"],
    "Kuliner & F&B": ["Foods", "Culinary", "Dining"],
    "Infrastruktur & Utilitas": ["Infrastructure", "Utilities", "Energy"],
    "Industri & Pergudangan": ["Industrial", "Logistics", "Manufacturing"],
    "Keuangan & Perbankan": ["Capital", "Financial", "Holdings"],
    "Pariwisata & Hiburan": ["Leisure", "Entertainment", "Tourism"],
    "Lainnya": ["Holdings", "Ventures", "Group"],
}

# country -> (name words, legal forms, first names, last names)
POOL = {
    "Jepang": (["Sakura", "Hinode", "Kaede", "Tsubasa", "Akebono", "Yamabuki", "Shirakawa", "Aoyama", "Tachibana", "Higashi", "Matsukaze", "Fujimi"],
               ["Co., Ltd.", "K.K."],
               ["Takeshi", "Hiroshi", "Yuki", "Akira", "Haruka", "Kenji", "Naoko", "Satoshi", "Emi", "Daichi", "Aya", "Ryo"],
               ["Yamamoto", "Tanaka", "Watanabe", "Kobayashi", "Nakamura", "Suzuki", "Fujita", "Ishikawa", "Matsuda", "Hayashi", "Ogawa"]),
    "Tiongkok": (["Jinlong", "Hongyuan", "Taihe", "Ruixiang", "Mingda", "Huaxin", "Zhongyi", "Yuanheng", "Xinghe", "Longteng", "Chengxin", "Hongfeng"],
                 ["Co., Ltd.", "Group Co., Ltd."],
                 ["Wei", "Mei", "Jun", "Xin", "Hao", "Ling", "Yan", "Fang", "Tao", "Jia", "Bo", "Qing"],
                 ["Zhang", "Wang", "Liu", "Chen", "Yang", "Huang", "Zhao", "Wu", "Zhou", "Xu", "Lin"]),
    "Korea Selatan": (["Hanbit", "Daeyang", "Mirae", "Seorin", "Haneul", "Geumgang", "Saebom", "Narae"],
                      ["Co., Ltd.", "Inc."],
                      ["Min-jun", "Seo-yeon", "Ji-ho", "Hye-jin", "Dong-hyun", "Soo-ah", "Tae-yang", "Ha-eun"],
                      ["Kim", "Park", "Lee", "Choi", "Jung", "Kang", "Yoon", "Han"]),
    "Malaysia": (["Seri Maju", "Bumi Perdana", "Cahaya Utama", "Permata", "Sinar Harapan", "Teratai", "Mutiara Timur", "Lembah Indah"],
                 ["Sdn Bhd", "Berhad"],
                 ["Farid", "Nurul", "Hafiz", "Aisyah", "Daniel", "Kavita", "Priya", "Zulkifli", "Mei Ling", "Raj"],
                 ["Hamdan", "Rahman", "Tan", "Lim", "Menon", "Nair", "Ibrahim", "Wong", "Abdullah", "Kumar"]),
    "Singapura": (["Straits", "Tanjong", "Kallang", "Orchid", "Harbourfront", "Pasir Crest", "Sentosa Gate", "Marina Crest"],
                  ["Pte Ltd"],
                  ["Jason", "Rachel", "Kumar", "Sarah", "Daniel", "Priya", "Amanda", "Farhan", "Michelle", "Wei Ming"],
                  ["Tan", "Lim", "Pillai", "Chua", "Ong", "Nair", "Goh", "Ismail", "Lee", "Teo"]),
    "Uni Emirat Arab": (["Al Noor", "Al Nakheel", "Al Waha", "Desert Crown", "Falcon Gate", "Pearl Bay", "Al Safa", "Golden Dunes"],
                        ["LLC", "FZE", "PJSC"],
                        ["Omar", "Layla", "Khalid", "Fatima", "Yousef", "Mariam", "Hamad", "Noura", "Rashid", "Sara"],
                        ["Al Farsi", "Haddad", "Al Mansoori", "Al Suwaidi", "Nasser", "Al Hashimi", "Al Ketbi", "Khalil", "Al Dhaheri", "Mahmoud"]),
    "Amerika Serikat": (["Northbridge", "Lakeshore", "Redwood", "Summit Ridge", "Cedar Point", "Bluestone", "Harborview", "Ironwood", "Pinecrest", "Oakline"],
                        ["Inc.", "LLC", "Corp."],
                        ["James", "Emily", "Michael", "Sarah", "David", "Jessica", "Daniel", "Ashley", "Robert", "Olivia", "Marcus", "Rachel"],
                        ["Carter", "Brooks", "Reyes", "Johnson", "Kim", "Morgan", "Okafor", "Nguyen", "Hayes", "Patel", "Bell", "Cohen"]),
    "Australia": (["Southern Cross", "Coral Coast", "Banksia", "Eucalypt", "Bluegum", "Red Centre", "Harbour Light", "Wattle"],
                  ["Pty Ltd", "Group Pty Ltd"],
                  ["Liam", "Chloe", "Jack", "Mia", "Noah", "Zoe", "Ethan", "Grace", "Lachlan", "Isla"],
                  ["Cooper", "Mitchell", "Thompson", "Harrison", "Sullivan", "Campbell", "Walsh", "Murray", "Fraser", "Kelly"]),
}
FOUNDATION_WORDS = ["Lighthouse", "Open Door", "Bridge", "Evergreen", "Horizon", "Kindred"]


def main():
    if os.path.exists(MAP_PATH):
        sys.exit("name_map.json already exists - the names are already globalized. Delete it only if you restored the data.")
    texts = {f: open(os.path.join(DATA, f), encoding="utf-8").read() for f in FILES if os.path.exists(os.path.join(DATA, f))}
    dash = json.loads(texts["dashboard.json"])
    master = dash["investment_monitoring"]["master_data"]

    comp = {}                                   # old name -> (country, sector)
    for r in master:
        comp.setdefault(r["Nama Pelaku Usaha"], (r["Asal Negara"], r.get("Sektor")))

    used, name_map, foundation_i = set(), {}, 0
    for old in sorted(comp):
        country, sektor = comp[old]
        if country == "Indonesia":
            if old.startswith("Yayasan"):
                new = old
            else:
                core = old[3:] if old.startswith("PT ") else old
                u = rnd.random()
                new = ("PT " + core) if u < 0.62 else (("CV " + core) if u < 0.80 else ("PT " + core + " Tbk"))
                m = re.match(r"^(.*?)( \d+)$", new)          # keep numeric de-dup suffix last: "... Tbk 2" -> "... 2" stays unique anyway
                if m and new.endswith(" Tbk" + m.group(2)):
                    new = m.group(1).replace(" Tbk", "") + " Tbk" + m.group(2)
        else:
            words, forms, _, _ = POOL[country]
            for _try in range(200):
                if old.startswith("Yayasan"):
                    new = "%s Foundation" % rnd.choice(FOUNDATION_WORDS) + ("" if _try == 0 else " " + rnd.choice(words))
                else:
                    new = "%s %s %s" % (rnd.choice(words), rnd.choice(DESC.get(sektor, DESC["Lainnya"])), rnd.choice(forms))
                if new not in used:
                    break
            else:
                raise RuntimeError("could not make a unique name for " + old)
        used.add(new)
        name_map[old] = new

    # company PIC: person name follows the company's country. Indonesian PICs stay (already Indonesian names).
    person_map, taken = {}, set()
    for r in master:
        p = r.get("Nama PIC Perusahaan")
        if not p or p in person_map:
            continue
        country = r["Asal Negara"]
        if country == "Indonesia":
            person_map[p] = p
            continue
        _, _, firsts, lasts = POOL[country]
        for _try in range(200):
            cand = "%s %s" % (rnd.choice(firsts), rnd.choice(lasts))
            if cand not in taken:
                break
        taken.add(cand)
        person_map[p] = cand
    person_map = {k: v for k, v in person_map.items() if k != v}

    # apply: longest-first regex, so "PT X 2" is replaced before "PT X"
    def rewrite(text):
        alts = sorted(name_map, key=len, reverse=True)
        rx = re.compile("|".join(re.escape(a) for a in alts) + r"(?![\w])")
        text = rx.sub(lambda m: name_map[m.group(0)], text)
        if person_map:
            palts = sorted(person_map, key=len, reverse=True)
            rp = re.compile(r"(?<![\w])(" + "|".join(re.escape(a) for a in palts) + r")(?![\w])")
            text = rp.sub(lambda m: person_map[m.group(1)], text)
        return text

    for f, t in texts.items():
        new = rewrite(t)
        json.loads(new)                                       # still valid JSON
        if new != t:
            open(os.path.join(DATA, f), "w", encoding="utf-8", newline="").write(new)
            print("rewrote", f)
    json.dump({"companies": name_map, "company_pic": person_map}, open(MAP_PATH, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(len(name_map), "company names,", len(person_map), "company PIC names")


if __name__ == "__main__":
    main()
