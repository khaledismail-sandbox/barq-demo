/* barq demo — hardcoded reference data (no backend). Rates are foreign units per 1 SAR. */
window.BarqData = (function () {
  var corridors = [
    { code: 'SA_IN', country: 'India',       cc: 'IN', currency: 'INR', rate: 22.45, flag: '🇮🇳', speed: 'instant',  popular: 1, added: 1 },
    { code: 'SA_PK', country: 'Pakistan',    cc: 'PK', currency: 'PKR', rate: 74.30, flag: '🇵🇰', speed: 'instant',  popular: 2, added: 2 },
    { code: 'SA_EG', country: 'Egypt',       cc: 'EG', currency: 'EGP', rate: 13.05, flag: '🇪🇬', speed: 'same_day', popular: 3, added: 3 },
    { code: 'SA_PH', country: 'Philippines', cc: 'PH', currency: 'PHP', rate: 15.35, flag: '🇵🇭', speed: 'instant',  popular: 4, added: 5 },
    { code: 'SA_BD', country: 'Bangladesh',  cc: 'BD', currency: 'BDT', rate: 32.10, flag: '🇧🇩', speed: 'next_day', popular: 5, added: 4 }
  ];

  // owner: the persona this beneficiary belongs to (hidden from the other persona), null = shared.
  var recipients = [
    { name: 'Ramesh Kumar',  corridor: 'SA_IN', method: 'Bank Transfer',  detail: 'State Bank of India',  owner: 'verified_returning' },
    { name: 'Priya Nair',    corridor: 'SA_IN', method: 'Bank Transfer',  detail: 'HDFC Bank',            owner: null },
    { name: 'Arjun Mehta',   corridor: 'SA_IN', method: 'Cash Pick Up',   detail: 'Kochi',                owner: null },
    { name: 'Ayesha Khan',   corridor: 'SA_PK', method: 'Digital Wallet', detail: 'JazzCash',             owner: 'new_unverified' },
    { name: 'Imran Ali',     corridor: 'SA_PK', method: 'Bank Transfer',  detail: 'Meezan Bank',          owner: null },
    { name: 'Bilal Ahmed',   corridor: 'SA_PK', method: 'Cash Pick Up',   detail: 'Lahore',               owner: null },
    { name: 'Ahmed Mostafa', corridor: 'SA_EG', method: 'Bank Transfer',  detail: 'Banque Misr',          owner: null },
    { name: 'Mona Adel',     corridor: 'SA_EG', method: 'Cash Pick Up',   detail: 'Cairo',                owner: null },
    { name: 'Maria Santos',  corridor: 'SA_PH', method: 'Digital Wallet', detail: 'GCash',                owner: null },
    { name: 'Jose Reyes',    corridor: 'SA_PH', method: 'Bank Transfer',  detail: 'BDO Unibank',          owner: null },
    { name: 'Rahim Uddin',   corridor: 'SA_BD', method: 'Digital Wallet', detail: 'bKash',                owner: null },
    { name: 'Nusrat Jahan',  corridor: 'SA_BD', method: 'Bank Transfer',  detail: 'Dutch-Bangla Bank',    owner: null }
  ];

  var personaDefaults = {
    verified_returning: { recipient: 'Ramesh Kumar', corridor: 'SA_IN', amount: 1500, balance: 8240.75, name: 'Abdulaziz' },
    new_unverified:     { recipient: 'Ayesha Khan',  corridor: 'SA_PK', amount: 800,  balance: 1000.00, name: 'Guest' }
  };

  return {
    corridors: corridors,
    recipients: recipients,
    personaDefaults: personaDefaults,
    FEE_SAR: 0,
    VAT_SAR: 0,
    FX_MARGIN_PCT: 1.0,
    RATE_VALID_SECONDS: 30,
    REFERRAL_CODES: { SAVEQX: 10, BARQ10: 10, FIRSTFREE: 15 },
    corridor: function (code) {
      for (var i = 0; i < corridors.length; i++) if (corridors[i].code === code) return corridors[i];
      return corridors[0];
    },
    recipient: function (name) {
      for (var i = 0; i < recipients.length; i++) if (recipients[i].name === name) return recipients[i];
      return null;
    },
    recipientsFor: function (persona, corridor) {
      return recipients.filter(function (r) {
        return (!r.owner || r.owner === persona) && (!corridor || r.corridor === corridor);
      });
    }
  };
})();
