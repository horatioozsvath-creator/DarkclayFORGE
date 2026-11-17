// Darkclay Forge. Copyright (c) 2026 the author (github.com/horatioozsvath-creator). All rights reserved: see LICENSE.
// THE BANK, with no page access: coin kept safe (a little interest), loans by renown (interest each week), the late letter and the
// bailiff. A week is counted only when the game is open at its end (interest pauses while away). Time comes in as plain milliseconds.
import { BANK, RENOWN } from './data.js?v=40';
import { rung } from './growth.js?v=40';
import { takeDown } from './shop.js?v=40';

export const bankOf = save => save.bank || (save.bank = { deposit: 0, loan: 0, borrowed: 0, due: 0, missed: 0 });
export const limitOf = save => BANK.limits[rung(save)] || 0;
export const canBorrow = save => Math.max(0, limitOf(save) - bankOf(save).loan);
// the first rung that lends, for the words
export const lendsFrom = () => RENOWN[BANK.limits.findIndex(n => n > 0)].word;
const int = n => Math.floor(Number(n) || 0);
// the week starts with the first deposit or loan; it stops when there's neither
function start(b, now) { if (!b.due) b.due = now + BANK.week; }
function settle(b) { if (!b.deposit && !b.loan) { b.due = 0; b.missed = 0; } }

export function deposit(save, n, now) {
  const b = bankOf(save); n = Math.min(int(n), save.coins);
  if (n <= 0) return { why: 'nothing to put in' };
  save.coins -= n; b.deposit += n; start(b, now); return { ok: true, n };
}
export function withdraw(save, n) {
  const b = bankOf(save); n = Math.min(int(n), b.deposit);
  if (n <= 0) return { why: 'nothing in the bank' };
  b.deposit -= n; save.coins += n; settle(b); return { ok: true, n };
}
export function borrow(save, n, now) {
  const b = bankOf(save); n = int(n);
  if (!limitOf(save)) return { why: 'the bank lends from ' + lendsFrom() };
  if (n <= 0) return { why: 'nothing asked' };
  if (n > canBorrow(save)) return { why: 'more than the bank will lend you' };
  b.loan += n; b.borrowed += n; save.coins += n; start(b, now); return { ok: true, n };
}
export function repay(save, n) {
  const b = bankOf(save); n = Math.min(int(n), b.loan, save.coins);
  if (n <= 0) return { why: b.loan ? 'no coin to pay with' : 'nothing owed' };
  save.coins -= n; b.loan -= n;
  if (!b.loan) { b.borrowed = 0; b.missed = 0; }
  settle(b); return { ok: true, n };
}
export const interestDue = save => Math.ceil(bankOf(save).loan * BANK.loanRate);
export const depositEarns = save => Math.min(BANK.depositCap, Math.floor(bankOf(save).deposit * BANK.depositRate));

// the week's end, while the game is open: the deposit's interest in; the loan's interest out of the purse, then the bank. Short of
// it: the letter (the unpaid part and a fee onto the loan); a second miss: the bailiff. A long time away counts as one week.
export function weekly(save, now) {
  const b = bankOf(save);
  if (!b.due || now < b.due) return null;
  const out = { earned: depositEarns(save), interest: interestDue(save), paid: 0, unpaid: 0, fee: 0, bailiff: null };
  b.deposit += out.earned;
  if (out.interest) {
    const fromPurse = Math.min(save.coins, out.interest); save.coins -= fromPurse;
    const fromBank = Math.min(b.deposit, out.interest - fromPurse); b.deposit -= fromBank;
    out.paid = fromPurse + fromBank; out.unpaid = out.interest - out.paid;
    if (out.unpaid) {
      out.fee = Math.ceil(out.interest * BANK.lateFee);
      b.loan = Math.min(b.borrowed * BANK.debtCap, b.loan + out.unpaid + out.fee); b.missed++;
      if (b.missed >= BANK.bailiffAfter) out.bailiff = bailiff(save, (out.unpaid + out.fee) * BANK.bailiffAfter);
    } else b.missed = 0;
  }
  b.due = now + BANK.week;
  settle(b);
  return out;
}
// the bailiff: the shelf's pieces, best first, toward what's owed (each piece's worth off the loan); never a Relic or a Mythic
export function bailiff(save, owed) {
  const b = bankOf(save), took = [];
  let got = 0;
  const shelf = (save.shelf || []).map((e, i) => ({ i, c: e && save.cards.find(x => x.id === e.id) }))
    .filter(x => x.c && x.c.tier !== 'relic' && x.c.tier !== 'mythic').sort((a, c) => c.c.worth - a.c.worth);
  for (const x of shelf) {
    if (got >= owed || !b.loan) break;
    takeDown(save, x.i); save.cards = save.cards.filter(c => c.id !== x.c.id);
    const off = Math.min(b.loan, x.c.worth); b.loan -= off; got += off; took.push({ name: x.c.name, worth: x.c.worth });
  }
  save.renown = Math.max(0, (save.renown || 0) - BANK.bailiffRenown); b.missed = 0;
  if (!b.loan) b.borrowed = 0;
  return { took, got };
}

// the gentler Reach: threats off for this save (milestones 20 on read it). A save from before them gets a week's grace.
export const gentle = save => !!save.gentle;
export function fixThreats(save, now) { if (save.threatsFrom == null) save.threatsFrom = now + BANK.grace; }
export const threatsOn = (save, now) => !gentle(save) && now >= (save.threatsFrom || 0);
