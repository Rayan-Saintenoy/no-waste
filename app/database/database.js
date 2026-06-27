import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("antigaspi.db");

export const initDatabase = () => {
  db.withTransactionSync(() => {
    db.execSync(`
      DROP TABLE IF EXISTS utilisateur;
      CREATE TABLE IF NOT EXISTS utilisateur (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          firstname TEXT,
          mail TEXT,
          poids_total_sauve_kg REAL DEFAULT 0.0,
          argent_total_sauve_eur REAL DEFAULT 0.0,
          alerte_delai_jours INTEGER DEFAULT 1,
          notifications_enabled INTEGER DEFAULT 1,
          stats_price_enabled INTEGER DEFAULT 1
      );
    `);

    db.execSync(`
      DROP TABLE IF EXISTS produits;
      CREATE TABLE IF NOT EXISTS produits (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          code_barre TEXT,
          nom_produit TEXT,
          marque TEXT,
          image_url TEXT,
          quantite_brute TEXT,
          categories TEXT,
          categories_hierarchy TEXT,
          poids_kg REAL,
          prix_achat REAL,
          date_peremption DATE,
          date_ajout DATETIME DEFAULT CURRENT_TIMESTAMP,
          statut TEXT DEFAULT 'dans_le_frigo'
      );
    `);

    /*db.execSync(`
      INSERT OR IGNORE INTO utilisateur (id, name, firstname, mail, poids_total_sauve_kg, argent_total_sauve_eur) 
      VALUES (1, 'Doe', 'John', 'john.doe@exemple.com', 0.0, 0.0);
    `);*/
  });
};

export default db;
