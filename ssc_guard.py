"""SAFETY GUARD for the root Python scripts (they overwrite src/data/deals.json).

Adam's rule: nothing overwrites the deal data without his explicit OK. The only
way these scripts may write a deals file is write_deals_file(), which:
  - only accepts an approval typed by a person in a real terminal (piped input,
    CI and AI tool shells are refused, so an AI session cannot approve on
    Adam's behalf; never add a flag or workaround that skips this),
  - shows a before/after summary, and
  - backs up the old file to data-archive/backups/ first.
Same rules as scripts/lib/guard.js.
"""
import json
import os
import re
import shutil
import sys
from datetime import datetime

ROOT = os.path.dirname(os.path.abspath(__file__))
BACKUPS = os.path.join(ROOT, 'data-archive', 'backups')
BAR = '=' * 72


def _summarize(text):
    try:
        deals = json.loads(text)
        active = [d for d in deals if d.get('active') is not False]
        names = {d.get('name') for d in active}
        stores = sum(len(d.get('locations') or []) for d in active)
        return f'{len(active)} active deals, {len(names)} businesses, {stores} store listings'
    except Exception:
        return 'not valid JSON!'


def _require_typed_approval(lines, phrase):
    print('\n' + BAR + '\n' + '\n'.join(lines) + '\n' + BAR)
    if not (sys.stdin.isatty() and sys.stdout.isatty()):
        print('\nBLOCKED: this needs Adam to type the approval in a real terminal.', file=sys.stderr)
        print('AI sessions: stop here and ask Adam to run this command himself. Do not work around this check.', file=sys.stderr)
        sys.exit(1)
    answer = input(f'\nTo approve, type exactly:  {phrase}\n> ')
    if answer.strip() != phrase:
        print('Not approved. Nothing was written.', file=sys.stderr)
        sys.exit(1)


def write_deals_file(path, text, script, extra_warning=None):
    target = os.path.abspath(path)
    before = None
    if os.path.exists(target):
        with open(target, encoding='utf-8') as f:
            before = f.read()
    if before == text:
        print(f'No changes to {target}; nothing written.')
        return
    lines = [
        f'OVERWRITE DEAL DATA - {script}',
        f'File: {target}',
        'Before: ' + (_summarize(before) if before is not None else '(file does not exist yet)'),
        'After:  ' + _summarize(text),
    ]
    if extra_warning:
        lines.append('WARNING: ' + extra_warning)
    lines.append('The current file will be backed up to data-archive/backups/ first.')
    _require_typed_approval(lines, 'OVERWRITE DEALS')
    if before is not None:
        os.makedirs(BACKUPS, exist_ok=True)
        stamp = datetime.now().strftime('%Y-%m-%dT%H-%M-%S')
        name = os.path.splitext(os.path.basename(target))[0]
        safe_script = re.sub(r'[^\w.-]', '_', script)
        backup = os.path.join(BACKUPS, f'{name}-{stamp}-{safe_script}.json')
        shutil.copyfile(target, backup)
        print(f'Backed up the old file to {backup}')
    with open(target, 'w', encoding='utf-8') as f:
        f.write(text)
    print(f'Wrote {target}')
