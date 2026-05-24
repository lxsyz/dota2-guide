#!/usr/bin/env python3
"""从 Dota 2 官方 datafeed 生成 heroes.json / items.json / sitemap.xml"""

import json
import re
import ssl
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
BASE = "https://www.dota2.com/datafeed"
UA = "Mozilla/5.0 (compatible; dota2-guide-builder/1.0)"

ROLE_NAMES = ["核心", "辅助", "爆发", "控制", "坦克", "逃生", "推进", "先手"]
ATTR_MAP = {0: "str", 1: "agi", 2: "int", 3: "uni"}
ATTR_CN = {"str": "力量", "agi": "敏捷", "int": "智力", "uni": "全能"}
ATTACK_MAP = {1: "melee", 2: "ranged"}
TALENT_LEVELS = ["10", "15", "20", "25"]

# 常见出装池（按定位）
BUILD_POOLS = {
    "core": {
        "starting": ["tango", "quelling_blade", "slippers", "circlet"],
        "early": ["power_treads", "magic_wand", "wraith_band"],
        "core": ["black_king_bar", "desolator", "manta"],
        "luxury": ["butterfly", "satanic", "abyssal_blade"],
    },
    "support": {
        "starting": ["tango", "clarity", "clarity", "ward_observer", "ward_sentry"],
        "early": ["tranquil_boots", "magic_wand", "wind_lace"],
        "core": ["glimmer_cape", "force_staff", "blink"],
        "luxury": ["aghanims_scepter", "ghost", "refresher_orb"],
    },
    "initiator": {
        "starting": ["tango", "clarity", "enchanted_mango", "ward_observer"],
        "early": ["arcane_boots", "magic_wand", "soul_ring"],
        "core": ["blink", "blade_mail", "black_king_bar"],
        "luxury": ["heart", "shivas_guard", "refresher_orb"],
    },
}

QUAL_MAP = {
    "consumable": "consumable",
    "component": "basic",
    "early": "basic",
    "mid": "mid",
    "late": "advanced",
    "secret_shop": "advanced",
    "common": "mid",
    "rare": "advanced",
    "epic": "luxury",
    "artifact": "luxury",
}


def fetch_json(url: str, retries=3):
    ctx = ssl.create_default_context()
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for i in range(retries):
        try:
            with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
                return json.loads(resp.read().decode())
        except Exception as e:
            if i == retries - 1:
                raise
            time.sleep(0.5 * (i + 1))
    return None


def strip_html(text: str) -> str:
    if not text:
        return ""
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def item_api_to_id(name: str) -> str:
    return name.replace("item_", "") if name.startswith("item_") else name


def hero_api_to_id(name: str) -> str:
    return name.replace("npc_dota_hero_", "")


def parse_roles(role_levels):
    roles = []
    for i, level in enumerate(role_levels or []):
        if level > 0 and i < len(ROLE_NAMES):
            roles.append(ROLE_NAMES[i])
    return roles or ["核心"]


def guess_positions(roles):
    positions = []
    if "核心" in roles:
        positions.append(1)
    if "爆发" in roles or "控制" in roles:
        positions.append(2)
    if "先手" in roles or "坦克" in roles:
        positions.append(3)
    if "辅助" in roles:
        positions.extend([4, 5])
    return sorted(set(positions)) or [2]


def guess_build(roles):
    if "辅助" in roles and "核心" not in roles:
        pool = BUILD_POOLS["support"]
    elif "先手" in roles or "坦克" in roles:
        pool = BUILD_POOLS["initiator"]
    else:
        pool = BUILD_POOLS["core"]
    return {
        "standard": {
            "name": "推荐出装",
            "starting": pool["starting"][:],
            "early": pool["early"][:],
            "core": pool["core"][:],
            "luxury": pool["luxury"][:],
        }
    }


def parse_talents(talents):
    result = {}
    if not talents:
        return {lvl: ["待更新", "待更新"] for lvl in TALENT_LEVELS}
    for idx, lvl in enumerate(TALENT_LEVELS):
        left = talents[idx * 2].get("name_loc", "待更新") if idx * 2 < len(talents) else "待更新"
        right = talents[idx * 2 + 1].get("name_loc", "待更新") if idx * 2 + 1 < len(talents) else "待更新"
        left = re.sub(r"\{[^}]+\}", "", left).strip()
        right = re.sub(r"\{[^}]+\}", "", right).strip()
        result[lvl] = [left or "待更新", right or "待更新"]
    return result


def parse_skills(abilities):
    skills = []
    for ab in abilities or []:
        if ab.get("ability_is_innate"):
            continue
        name = ab.get("name", "")
        if "special_bonus" in name:
            continue
        if ab.get("type") not in (0, 1):
            continue
        # 祈求者只保留元素球+祈唤
        if name.startswith("invoker_") and name not in (
            "invoker_quas", "invoker_wex", "invoker_exort", "invoker_invoke"
        ):
            continue
        skill_type = "passive" if ab.get("type") == 0 and "passive" in strip_html(ab.get("desc_loc", "")).lower() else "active"
        if ab.get("type") == 1:
            skill_type = "active"
        skills.append({
            "name": ab.get("name_loc", name),
            "name_en": name.replace("_", " ").title(),
            "description": strip_html(ab.get("desc_loc") or ab.get("lore_loc") or ""),
            "type": skill_type,
            "icon": name,
            "ultimate": ab.get("type") == 1,
        })
        if len(skills) >= 6:
            break
    return skills[:6]


def parse_aghanims(abilities):
    scepter_parts = []
    shard_parts = []
    for ab in abilities or []:
        s = strip_html(ab.get("scepter_loc", ""))
        sh = strip_html(ab.get("shard_loc", ""))
        if s:
            scepter_parts.append(s)
        if sh:
            shard_parts.append(sh)
    return {
        "scepter": "；".join(scepter_parts) if scepter_parts else "暂无神杖升级说明。",
        "shard": "；".join(shard_parts) if shard_parts else "暂无魔晶升级说明。",
    }


def transform_hero(raw, manual=None):
    roles = parse_roles(raw.get("role_levels"))
    hero_id = hero_api_to_id(raw["name"])
    attr = ATTR_MAP.get(raw.get("primary_attr"), "uni")

    hero = {
        "id": hero_id,
        "name": raw.get("name_loc", hero_id),
        "name_en": raw.get("name_english_loc") or hero_id.replace("_", " ").title(),
        "attribute": attr,
        "attack_type": ATTACK_MAP.get(raw.get("attack_capability"), "melee"),
        "roles": roles,
        "complexity": raw.get("complexity", 1),
        "tier": "B",
        "positions": guess_positions(roles),
        "lore": strip_html(raw.get("bio_loc", ""))[:200],
        "stats": {
            "str_base": raw.get("str_base", 0),
            "str_gain": raw.get("str_gain", 0),
            "agi_base": raw.get("agi_base", 0),
            "agi_gain": raw.get("agi_gain", 0),
            "int_base": raw.get("int_base", 0),
            "int_gain": raw.get("int_gain", 0),
            "damage_min": raw.get("damage_min", 0),
            "damage_max": raw.get("damage_max", 0),
            "armor": raw.get("armor", 0),
            "move_speed": raw.get("movement_speed", 300),
            "attack_range": raw.get("attack_range", 150),
            "bat": raw.get("attack_rate", 1.7),
        },
        "skills": parse_skills(raw.get("abilities")),
        "talents": parse_talents(raw.get("talents")),
        "aghanims": parse_aghanims(raw.get("abilities")),
        "builds": guess_build(roles),
        "skill_build": [1] * 25,
        "counters": {"good_against": [], "bad_against": []},
        "tips": {
            "laning": strip_html(raw.get("npe_desc_loc") or raw.get("hype_loc") or "利用技能优势控制兵线，注意视野与走位。"),
            "teamfight": strip_html(raw.get("hype_loc") or "根据定位选择合适进场时机，优先保护己方核心或切敌方后排。"),
        },
    }

    if manual:
        for key in ("tier", "builds", "counters", "tips", "skill_build", "positions", "lore"):
            if manual.get(key):
                hero[key] = manual[key]
        if manual.get("skills") and len(manual["skills"]) >= 4:
            hero["skills"] = manual["skills"]
        if manual.get("talents"):
            hero["talents"] = manual["talents"]
        if manual.get("aghanims"):
            hero["aghanims"] = manual["aghanims"]
    return hero


MANUAL_ALIASES = {"anti_mage": "antimage"}


def load_manual_heroes():
    path = DATA / "heroes.manual.json"
    legacy = DATA / "heroes.json"
    source = path if path.exists() else legacy
    if not source.exists():
        return {}
    with open(source, encoding="utf-8") as f:
        data = json.load(f)
    manual = {}
    for h in data:
        manual[h["id"]] = h
        alias = MANUAL_ALIASES.get(h["id"])
        if alias:
            manual[alias] = h
    return manual


def build_heroes():
    print("Fetching hero list...")
    hero_list = fetch_json(f"{BASE}/herolist?language=schinese")["result"]["data"]["heroes"]
    manual = load_manual_heroes()
    heroes = []

    def fetch_one(h):
        hid = h["id"]
        data = fetch_json(f"{BASE}/herodata?language=schinese&hero_id={hid}")
        raw = data["result"]["data"]["heroes"][0]
        return transform_hero(raw, manual.get(hero_api_to_id(raw["name"])))

    print(f"Fetching {len(hero_list)} heroes...")
    with ThreadPoolExecutor(max_workers=8) as ex:
        futures = {ex.submit(fetch_one, h): h for h in hero_list}
        done = 0
        for fut in as_completed(futures):
            heroes.append(fut.result())
            done += 1
            if done % 20 == 0:
                print(f"  {done}/{len(hero_list)}")

    heroes.sort(key=lambda x: x["name"])
    out = DATA / "heroes.json"
    with open(out, "w", encoding="utf-8") as f:
        json.dump(heroes, f, ensure_ascii=False, indent=2)
    print(f"Wrote {len(heroes)} heroes -> {out}")
    return heroes


def parse_item_stats(special_values, attrib):
    stats = {}
    for sv in special_values or []:
        heading = sv.get("heading_loc", "")
        if heading:
            stats[heading.replace("+", "").strip()] = True
    for a in attrib or []:
        disp = a.get("display", "")
        if disp:
            stats[disp.replace("+", "").strip()] = True
    return stats


def transform_item(raw, constants=None):
    item_id = item_api_to_id(raw.get("name", ""))
    const = (constants or {}).get(item_id, {})
    qual = QUAL_MAP.get(const.get("qual", "component"), "basic")
    cost = const.get("cost", raw.get("item_cost", 0)) or 0

    active = None
    passive = None
    for ab in raw.get("abilities") or const.get("abilities") or []:
        desc = strip_html(ab.get("description") or ab.get("desc_loc") or "")
        title = ab.get("title") or ab.get("name_loc") or ""
        text = f"{title}：{desc}" if title else desc
        if ab.get("type") == "passive" or "被动" in text:
            passive = text
        else:
            active = text

    desc = strip_html(raw.get("desc_loc") or const.get("lore") or const.get("dname") or "")
    components = []
    for c in const.get("components") or []:
        if c != "recipe":
            components.append(c)

    return {
        "id": item_id,
        "name": raw.get("name_loc") or const.get("dname", item_id),
        "name_en": raw.get("name_english_loc") or const.get("dname", item_id),
        "category": qual,
        "cost": cost,
        "description": desc or strip_html(const.get("lore", "")),
        "stats": parse_item_stats(raw.get("special_values"), const.get("attrib")),
        "active": active,
        "passive": passive,
        "recipe": bool(const.get("created")),
        "components": components,
        "recommended_heroes": [],
    }


def build_items():
    print("Fetching item metadata...")
    item_list = fetch_json(f"{BASE}/itemlist?language=schinese")["result"]["data"]["itemabilities"]
    try:
        constants = fetch_json("https://api.opendota.com/api/constants/items")
    except Exception:
        constants = {}

    # 只保留非中立、有成本的常规物品
    shop_items = [
        i for i in item_list
        if i.get("neutral_item_tier", -1) == -1 and not i.get("is_innate")
    ]

    items_map = {}
    print(f"Fetching details for {len(shop_items)} items...")

    def fetch_item_detail(item):
        iid = item["id"]
        try:
            data = fetch_json(f"{BASE}/itemdata?language=schinese&item_id={iid}")
            raw = data["result"]["data"]["items"][0]
        except Exception:
            raw = item
        item_id = item_api_to_id(item["name"])
        const = constants.get(item_id, {})
        merged = {**item, **raw}
        return transform_item(merged, constants)

    with ThreadPoolExecutor(max_workers=10) as ex:
        futures = [ex.submit(fetch_item_detail, i) for i in shop_items]
        for idx, fut in enumerate(as_completed(futures), 1):
            item = fut.result()
            if item["cost"] > 0 or item["category"] == "consumable":
                items_map[item["id"]] = item
            if idx % 50 == 0:
                print(f"  {idx}/{len(shop_items)}")

    items = sorted(items_map.values(), key=lambda x: (x["category"], x["cost"]))
    out = DATA / "items.json"
    with open(out, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
    print(f"Wrote {len(items)} items -> {out}")
    return items


def build_sitemap(heroes):
    base = "https://lxsyz.github.io/dota2-guide"
    urls = [
        ("index.html", "weekly", "1.0"),
        ("heroes.html", "weekly", "0.9"),
        ("items.html", "weekly", "0.9"),
        ("guides.html", "weekly", "0.9"),
        ("meta.html", "weekly", "0.8"),
        ("tools.html", "monthly", "0.6"),
    ]
    for h in heroes:
        urls.append((f"hero-detail.html?id={h['id']}", "monthly", "0.7"))

    lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for loc, freq, pri in urls:
        lines.append("  <url>")
        lines.append(f"    <loc>{base}/{loc}</loc>")
        lines.append("    <lastmod>2026-05-24</lastmod>")
        lines.append(f"    <changefreq>{freq}</changefreq>")
        lines.append(f"    <priority>{pri}</priority>")
        lines.append("  </url>")
    lines.append("</urlset>")

    out = ROOT / "sitemap.xml"
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote sitemap with {len(urls)} URLs -> {out}")


def backup_manual_heroes():
    src = DATA / "heroes.json"
    dst = DATA / "heroes.manual.json"
    if src.exists() and not dst.exists():
        # 仅当现有文件是手工精编版（英雄少但字段全）时备份
        with open(src, encoding="utf-8") as f:
            data = json.load(f)
        if len(data) <= 20:
            dst.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
            print(f"Backed up manual heroes -> {dst}")


def main():
    backup_manual_heroes()
    heroes = build_heroes()
    build_items()
    build_sitemap(heroes)
    print("Done.")


if __name__ == "__main__":
    main()
