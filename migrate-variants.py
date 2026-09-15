#!/usr/bin/env python3
# Copyright (C) 2026 Aaron Solochek. Licensed under the GNU GPL v3; see LICENSE.
"""One-off migration (2026-09-15): combined head types -> head shape + properties (variant keys).
   usage: migrate-variants.py data/fasteners.json data/printed.json   (rewrites both in place; back them up first)"""
import json, sys
MAP = { 'sheetmetal': 'pan:p', 'buttonsm': 'button:p', 'trusssm': 'truss:p', 'hexsm': 'hexwasher:p', 'flangesm': 'flange:p', 'wood': 'flat:p', 'trim': 'trim:p',
        'pandrill': 'pan:p:c', 'hexdrill': 'hexwasher:p:c', 'flatdrill': 'flat:p:c', 'hexslot': 'hex', 'hexsmslot': 'hexwasher:p', 'hexdrillslot': 'hexwasher:p:c', 'sems': 'pan:ws' }
SLOTTED = {'hexslot', 'hexsmslot', 'hexdrillslot'}          # these carried the slot in the head name; it becomes the hex+slotted drive
SHAPE_OF = { 'sheetmetal': 'pan', 'buttonsm': 'button', 'trusssm': 'truss', 'hexsm': 'hexwasher', 'flangesm': 'flange', 'wood': 'flat', 'hexslot': 'hex', 'hexsmslot': 'hexwasher', 'hexdrillslot': 'hexwasher', 'pandrill': 'pan', 'hexdrill': 'hexwasher', 'flatdrill': 'flat', 'sems': 'pan' }
def main(data_path, printed_path):
    d = json.load(open(data_path)); n = 0
    for p in d['pages']:
        if p.get('kind') == 'list': continue
        heads = []
        for h in p.get('heads', []):
            sh = SHAPE_OF.get(h, h)
            if sh not in heads: heads.append(sh)
        p['heads'] = heads
        for k, c in p['cells'].items():
            det = c.get('detail') or {}
            newtypes = []
            for t in c.get('types', []):
                nt = MAP.get(t, t)
                if nt in newtypes:   # two old types collapse onto one variant: merge their detail
                    old = det.pop(t, None)
                    if old: merge(det.setdefault(nt, {}), old)
                else:
                    newtypes.append(nt)
                    if t != nt and t in det: det[nt] = det.pop(t)
                if t in SLOTTED:
                    info = det.setdefault(nt, {}); info.setdefault('drives', {}).setdefault('hexslot', [])
                    info['drives'].pop('hex', None) if not info['drives'].get('hex') else None
                if t != nt: n += 1
            c['types'] = newtypes
            for t in list(det):   # orphaned detail entries under old names
                if t in MAP and t not in newtypes: det[MAP[t]] = det.pop(t)
            if det: c['detail'] = det
    d['rev'] = (d.get('rev') or 0) + 1   # open tabs holding the old model must reload, not save over this
    json.dump(d, open(data_path, 'w'), indent=1)
    pr = json.load(open(printed_path)); m = 0
    for key, sig in list(pr.items()):
        parts = sig.split('|')
        if len(parts) >= 4:
            types = parts[-1].split(',')
            nts = [MAP.get(t, t) for t in types if t]
            if nts != types: parts[-1] = ','.join(nts); pr[key] = '|'.join(parts); m += 1
    json.dump(pr, open(printed_path, 'w'), indent=1)
    print(f'{n} type entries renamed, {m} printed signatures updated')
def merge(dst, src):
    for drv, mats in (src.get('drives') or {}).items():
        lst = dst.setdefault('drives', {}).setdefault(drv, []); [lst.append(x) for x in mats if x not in lst]
    for x in src.get('materials') or []:
        lst = dst.setdefault('materials', []); x in lst or lst.append(x)
    for f in ('loc', 'overflow', 'items'):
        if f in src and f not in dst: dst[f] = src[f]
if __name__ == '__main__': main(sys.argv[1], sys.argv[2])
