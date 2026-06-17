import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

async function main() {
  const conn = await mysql.createConnection(DATABASE_URL);

  // Get currency IDs
  const [currencies] = await conn.query("SELECT id, code, network FROM currencies");
  const getIdByCode = (code, network = null) => {
    const c = currencies.find(r => r.code === code && r.network === network);
    return c ? c.id : null;
  };

  const btcId = getIdByCode("BTC");
  const ethId = getIdByCode("ETH");
  const ltcId = getIdByCode("LTC");
  const xmrId = getIdByCode("XMR");
  const tonId = getIdByCode("TON");
  const trxId = getIdByCode("TRX");
  const usdtErc20Id = getIdByCode("USDT", "ERC20");
  const usdtTrc20Id = getIdByCode("USDT", "TRC20");
  const usdtBep20Id = getIdByCode("USDT", "BEP20");
  const usdtSolId = getIdByCode("USDT", "SOL");
  const usdtTonId = getIdByCode("USDT", "TON");
  const visaId = getIdByCode("VISA_MC");
  const tbankId = getIdByCode("TBANK");
  const sberId = getIdByCode("SBER");
  const sbpId = getIdByCode("SBP");
  const mirId = getIdByCode("MIR");

  // Test rates (approximate market rates in RUB)
  const rates = [
    // Crypto -> Fiat (RUB)
    { from: btcId, to: visaId, rate: "9250000", markup: "2.0" },
    { from: btcId, to: tbankId, rate: "9250000", markup: "2.0" },
    { from: btcId, to: sberId, rate: "9250000", markup: "2.0" },
    { from: btcId, to: sbpId, rate: "9250000", markup: "2.0" },
    { from: btcId, to: mirId, rate: "9250000", markup: "2.5" },
    { from: ethId, to: visaId, rate: "350000", markup: "2.0" },
    { from: ethId, to: tbankId, rate: "350000", markup: "2.0" },
    { from: ethId, to: sbpId, rate: "350000", markup: "2.0" },
    { from: ltcId, to: visaId, rate: "12500", markup: "2.5" },
    { from: ltcId, to: sbpId, rate: "12500", markup: "2.5" },
    { from: xmrId, to: visaId, rate: "25000", markup: "3.0" },
    { from: xmrId, to: sbpId, rate: "25000", markup: "3.0" },
    { from: tonId, to: visaId, rate: "550", markup: "2.0" },
    { from: tonId, to: sbpId, rate: "550", markup: "2.0" },
    { from: trxId, to: visaId, rate: "22", markup: "2.5" },
    { from: trxId, to: sbpId, rate: "22", markup: "2.5" },
    { from: usdtTrc20Id, to: visaId, rate: "97", markup: "1.5" },
    { from: usdtTrc20Id, to: tbankId, rate: "97", markup: "1.5" },
    { from: usdtTrc20Id, to: sberId, rate: "97", markup: "1.5" },
    { from: usdtTrc20Id, to: sbpId, rate: "97", markup: "1.5" },
    { from: usdtErc20Id, to: visaId, rate: "97", markup: "2.0" },
    { from: usdtErc20Id, to: sbpId, rate: "97", markup: "2.0" },
    { from: usdtBep20Id, to: visaId, rate: "97", markup: "1.5" },
    { from: usdtBep20Id, to: sbpId, rate: "97", markup: "1.5" },
    { from: usdtSolId, to: visaId, rate: "97", markup: "1.5" },
    { from: usdtTonId, to: visaId, rate: "97", markup: "1.5" },
    // Fiat -> Crypto
    { from: visaId, to: btcId, rate: "0.0000001050", markup: "3.0" },
    { from: sbpId, to: btcId, rate: "0.0000001050", markup: "3.0" },
    { from: visaId, to: ethId, rate: "0.0000028", markup: "3.0" },
    { from: sbpId, to: ethId, rate: "0.0000028", markup: "3.0" },
    { from: visaId, to: usdtTrc20Id, rate: "0.0100", markup: "2.0" },
    { from: sbpId, to: usdtTrc20Id, rate: "0.0100", markup: "2.0" },
    { from: tbankId, to: usdtTrc20Id, rate: "0.0100", markup: "2.0" },
    { from: visaId, to: tonId, rate: "0.00175", markup: "2.5" },
    { from: sbpId, to: tonId, rate: "0.00175", markup: "2.5" },
  ];

  // Clear existing rates
  await conn.query("DELETE FROM exchange_rates");

  // Insert rates
  for (const r of rates) {
    if (!r.from || !r.to) continue;
    await conn.query(
      "INSERT INTO exchange_rates (fromCurrencyId, toCurrencyId, rate, markupPercent, isActive) VALUES (?, ?, ?, ?, 1)",
      [r.from, r.to, r.rate, r.markup]
    );
  }

  console.log(`Inserted ${rates.filter(r => r.from && r.to).length} exchange rates`);
  await conn.end();
}

main().catch(console.error);
