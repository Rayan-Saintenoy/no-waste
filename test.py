import json
from sentence_transformers import SentenceTransformer, util

# --- 1. Chargement et préparation des données ---
print("Chargement du fichier JSON...")
with open('categories.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

termes_recherche = []  # Va contenir les noms ET les synonymes
ids_correspondants = [] # L'ID de la catégorie pour chaque terme

for cat_id, cat_info in data.items():
    # 1. On récupère le nom principal (FR ou EN)
    nom = cat_info.get("name", {}).get("fr") or cat_info.get("name", {}).get("en")
    if nom:
        termes_recherche.append(nom)
        ids_correspondants.append(cat_id)
    
    # 2. LA NOUVEAUTÉ : On récupère aussi tous les synonymes français !
    synonymes = cat_info.get("synonyms", {}).get("fr", [])
    for syn in synonymes:
        termes_recherche.append(syn)
        ids_correspondants.append(cat_id)

print(f"Extraction terminée : {len(termes_recherche)} termes et synonymes trouvés.")

# --- 2. Initialisation de l'IA Sémantique ---
print("Encodage en cours (ça va prendre un peu plus de temps vu qu'il y a les synonymes)...")
modele = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
vecteurs_categories = modele.encode(termes_recherche)

# --- 3. Fonction principale de classification ---
def classer_produit(nom_produit):
    vecteur_produit = modele.encode(nom_produit)
    
    # Calcul de la similarité avec TOUS les termes (noms + synonymes)
    resultats = util.cos_sim(vecteur_produit, vecteurs_categories)
    index_meilleur = resultats.argmax().item()
    
    # On retrouve l'ID de la catégorie gagnante
    cat_id = ids_correspondants[index_meilleur]
    
    # On récupère le vrai nom officiel de cette catégorie pour l'affichage
    cat_nom_officiel = data[cat_id].get("name", {}).get("fr") or cat_id
    terme_qui_a_matche = termes_recherche[index_meilleur]
    
    # --- 4. Reconstruction de la hiérarchie ---
    hierarchie = [cat_nom_officiel]
    parents = data[cat_id].get("parents", [])
    
    while parents:
        parent_id = parents[0]
        parent_info = data.get(parent_id, {})
        nom_parent = parent_info.get("name", {}).get("fr") or parent_info.get("name", {}).get("en") or parent_id
        hierarchie.append(nom_parent)
        parents = parent_info.get("parents", [])
        
    chemin_complet = " > ".join(reversed(hierarchie))
    
    return cat_nom_officiel, cat_id, chemin_complet, terme_qui_a_matche

# --- 5. Testons le script ! ---
produits_a_tester = [
    "Sachet de mangues déshydratées",
    "Pot de crème glacée au caramel",
    "Graines de chia bio"
]

print("\n--- RÉSULTATS DE L'IA ---")
for produit in produits_a_tester:
    nom, identifiant, chemin, match = classer_produit(produit)
    print(f"Produit recherché : '{produit}'")
    print(f"-> Catégorie ID   : {identifiant}")
    print(f"-> Terme matché   : {match}") # Pour comprendre comment l'IA a fait son lien !
    print(f"-> Hiérarchie     : {chemin}\n")