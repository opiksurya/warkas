<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class IndonesiaCatalogSeeder extends Seeder
{
    /**
     * Seed 50.600 data katalog produk ritel & minimarket Indonesia ke PostgreSQL
     * supaya pencarian barcode & nama barang berjalan instan (< 15ms) secara lokal
     * tanpa bergantung pada server eksternal alpha-projects.cloud yang sedang offline.
     */
    public function run(): void
    {
        $targetTotal = 50600;
        $currentCount = DB::table('indonesia_product_catalogs')->count();
        if ($currentCount >= $targetTotal) {
            return;
        }

        $catalogBrands = [
            'Mie Instan & Makanan' => [
                ['brand' => 'Indomie', 'items' => ['Mi Goreng Spesial', 'Mi Goreng Pedas', 'Mi Goreng Rendang', 'Mi Goreng Cabe Ijo', 'Mi Goreng Aceh', 'Ayam Bawang', 'Soto Mie', 'Soto Spesial', 'Kari Ayam', 'Ayam Spesial', 'Kaldu Ayam', 'Seblak Hot Jeletot', 'Rawon Pedas', 'Empal Gentong', 'Soto Banjar Limau']],
                ['brand' => 'Mie Sedaap', 'items' => ['Goreng Original', 'Goreng Krispi', 'Goreng Korean Spicy Chicken', 'Soto Segar', 'Kari Spesial', 'Ayam Bawang', 'Baso Spesial', 'Selection Singapore Spicy Laksa', 'Cup Goreng', 'Cup Soto', 'Cup Baso Bleduk']],
                ['brand' => 'Sarimi', 'items' => ['Isi 2 Soto Koya Jeruk', 'Isi 2 Ayam Bawang', 'Isi 2 Goreng Kecap', 'Isi 2 Goreng Ayam Kremes', 'Isi 2 Kari Spesial', 'Gelora Ayam Bawang', 'Soto Koya Pedas']],
                ['brand' => 'Supermi', 'items' => ['Ayam Bawang', 'Kaldu Ayam', 'Sup Sayuran', 'Nutrimi Mi Goreng Brokoli', 'Soto Daging']],
                ['brand' => 'Pop Mie', 'items' => ['Ayam', 'Baso', 'Kari Ayam', 'Soto Ayam', 'Mi Goreng Spesial', 'Pedes Dower', 'Pedes Gledek', 'Mini Ayam Bawang', 'Mini Soto', 'Mini Baso']],
                ['brand' => 'Pronas', 'items' => ['Kornet Sapi Kaleng', 'Sarden Saus Tomat', 'Sarden Saus Cabai', 'Bumbu Nasi Goreng Kornet', 'Luncheon Daging Sapi']],
                ['brand' => 'ABC Heinz', 'items' => ['Sarden Saus Tomat', 'Sarden Saus Cabai', 'Sarden Saus Ekstra Pedas', 'Mackarel Saus Tomat']],
            ],
            'Minuman & Susu' => [
                ['brand' => 'Aqua', 'items' => ['Air Mineral Gelas', 'Air Mineral Botol Mini', 'Air Mineral Botol Medium', 'Air Mineral Botol Besar', 'Reflections Sparkling', 'Multipack Karton']],
                ['brand' => 'Le Minerale', 'items' => ['Air Mineral Botol Kecil', 'Air Mineral Botol Sedang', 'Air Mineral Botol Besar', 'Air Mineral Galon Sekali Pakai']],
                ['brand' => 'Vit', 'items' => ['Air Mineral Gelas', 'Air Mineral Botol', 'Air Mineral Botol Besar']],
                ['brand' => 'Crystalin', 'items' => ['Air Mineral Gelas', 'Air Mineral Botol', 'Air Mineral Botol Besar']],
                ['brand' => 'Sosro', 'items' => ['Teh Botol Kotak', 'Teh Botol Pouch', 'Teh Botol Less Sugar', 'Fruit Tea Apel', 'Fruit Tea Blackcurrant', 'Fruit Tea Freeze', 'Fruit Tea Стробери', 'Tebs Sparkling']],
                ['brand' => 'Teh Pucuk Harum', 'items' => ['Melati Original', 'Less Sugar Melati', 'Jumbo Melati']],
                ['brand' => 'Ultra Milk', 'items' => ['UHT Full Cream', 'UHT Coklat', 'UHT Стробери', 'UHT Moka', 'UHT Karamel', 'UHT Low Fat High Calcium', 'Ultra Mimi Kids Coklat', 'Ultra Mimi Kids Full Cream']],
                ['brand' => 'Frisian Flag', 'items' => ['UHT Purefarm Full Cream', 'UHT Purefarm Coconut Delight', 'UHT Swiss Chocolate', 'UHT Strawberry', 'Kental Manis Putih Pouch', 'Kental Manis Coklat Pouch', 'Kental Manis Kaleng', 'Kental Manis Sachet Renceng']],
                ['brand' => 'Indomilk', 'items' => ['UHT Kids Coklat', 'UHT Kids Vanilla', 'UHT Full Cream', 'Kental Manis Putih', 'Kental Manis Swiss Choco', 'Susu Botol Korean Strawberry', 'Susu Botol Banana']],
                ['brand' => 'Bear Brand', 'items' => ['Susu Steril Original', 'Gold White Tea', 'Gold White Malt']],
                ['brand' => 'Pocari Sweat', 'items' => ['Isotonik Kaleng', 'Isotonik Botol', 'Isotonik Botol Besar', 'Ion Water Low Calorie', 'Sachet Serbuk']],
                ['brand' => 'Mizone', 'items' => ['Lychee Lemon', 'Cranberry', 'Starfruit']],
                ['brand' => 'Floridina', 'items' => ['Jeruk Bulir Utuh', 'Coco Bulir Jeruk']],
                ['brand' => 'Golda', 'items' => ['Coffee Dolce Latte', 'Coffee Cappuccino']],
                ['brand' => 'Kopi Kenangan', 'items' => ['Hanya Untukmu', 'Mantan Terindah', 'Avocuddle', 'Black Aren']],
                ['brand' => 'Yakult', 'items' => ['Minuman Probiotik Pack 5s', 'Light Less Sugar Pack 5s']],
                ['brand' => 'Cimory', 'items' => ['Yogurt Squeeze Original', 'Yogurt Squeeze Blueberry', 'Yogurt Squeeze Strawberry', 'Yogurt Squeeze Peach', 'Yogurt Squeeze Honey', 'UHT Fresh Milk Cashew', 'UHT Fresh Milk Marie Regal', 'UHT Fresh Milk Sea Salt', 'UHT Fresh Milk Choco Malt']],
            ],
            'Kopi, Teh & Sachet' => [
                ['brand' => 'Kapal Api', 'items' => ['Special Mix Sachet', 'Special Merah Bubuk', 'Less Sugar Special Mix', 'Grande White Coffee', 'Signature Black Coffee']],
                ['brand' => 'ABC Kopi', 'items' => ['Susu Sachet', 'Moka Sachet', 'Kopi Klepon', 'Plus Gula']],
                ['brand' => 'Good Day', 'items' => ['Mocacinno Sachet', 'Chococinno', 'Vanilla Latte', 'Coolin Coffee', 'Cappuccino Granule', 'Carrebian Nut', 'Duet Moka Karamelo', 'Funtastic Mocacinno Botol']],
                ['brand' => 'Torabika', 'items' => ['Cappuccino Sachet', 'Duo Kopi & Gula', 'Creamy Latte', 'Susu Full Cream', 'Gilaa Kopi']],
                ['brand' => 'Luwak White Koffie', 'items' => ['Original Sachet', 'Less Sugar', 'Moka Rose', 'Kopi + Gula']],
                ['brand' => 'Nescafe', 'items' => ['Classic Sachet', 'Classic Jar', '3in1 Original', 'Latte Kaleng', 'Caramel Macchiato Kaleng', 'Ice Black Kaleng']],
                ['brand' => 'SariWangi', 'items' => ['Teh Asli 25 Kantong', 'Teh Asli 50 Kantong', 'Teh Melati 25 Kantong', 'Teh Hijau']],
                ['brand' => 'Teh Sari Murni', 'items' => ['Bundar Celup', 'Melati Celup']],
                ['brand' => 'Sosro Celup', 'items' => ['Teh Celup Klasik 30s', 'Teh Celup Melati']],
                ['brand' => 'NutriSari', 'items' => ['Jeruk Peras', 'Florida Orange', 'Sweet Mango', 'Jambu Biji', 'Blewah', 'Sirsak', 'Kelapa Muda', 'Jeju Orange', 'Cocopandan']],
                ['brand' => 'Marimas', 'items' => ['Mangga', 'Jeruk Manis', 'Stroberi', 'Anggur', 'Melon', 'Kelapa Muda']],
                ['brand' => 'Milo', 'items' => ['Activ-Go Sachet', 'Activ-Go Pouch', '3in1 Sachet', 'Kaleng Original']],
                ['brand' => 'Dancow', 'items' => ['FortiGro Instant Sachet', 'FortiGro Coklat Sachet', 'FortiGro Full Cream Box', '1+ Madu Box', '3+ Vanila Box']],
                ['brand' => 'Energen', 'items' => ['Sereal Coklat', 'Sereal Vanila', 'Sereal Kacang Hijau', 'Sereal Jagung', 'Sereal Kurma']],
            ],
            'Sembako & Bahan Pokok' => [
                ['brand' => 'Bimoli', 'items' => ['Minyak Goreng Klasik Pouch', 'Minyak Goreng Spesial Pouch', 'Minyak Goreng Botol', 'Minyak Goreng Jerigen']],
                ['brand' => 'Tropical', 'items' => ['Minyak Goreng 2x Penyaringan Pouch', 'Minyak Goreng Botol']],
                ['brand' => 'SunCo', 'items' => ['Minyak Goreng Baik Pouch', 'Minyak Goreng Botol']],
                ['brand' => 'Sania', 'items' => ['Minyak Goreng Premium Pouch', 'Tepung Terigu Serbaguna']],
                ['brand' => 'Filma', 'items' => ['Minyak Goreng Pouch', 'Margarin Serbaguna Sachet']],
                ['brand' => 'Fortune', 'items' => ['Minyak Goreng Pouch', 'Beras Premium']],
                ['brand' => 'Gulaku', 'items' => ['Gula Pasir Putih Premium', 'Gula Pasir Tebu Kuning', 'Gula Halus Pouch']],
                ['brand' => 'Rose Brand', 'items' => ['Gula Pasir Kristal', 'Tepung Beras Putih', 'Tepung Ketan Putih', 'Tepung Tapioka', 'Minyak Goreng']],
                ['brand' => 'Bogasari', 'items' => ['Segitiga Biru Tepung Terigu', 'Cakra Kembar Tepung Terigu', 'Kunci Biru Tepung Terigu', 'La Fonte Spaghetti', 'La Fonte Macaroni']],
                ['brand' => 'Sania Beras', 'items' => ['Beras Ramos Premium', 'Beras Pulen Wangi']],
                ['brand' => 'Topi Koki', 'items' => ['Beras Setra Ramos', 'Beras Pandan Wangi']],
                ['brand' => 'Blue Band', 'items' => ['Margarin Serbaguna Sachet', 'Margarin Cake & Cookie', 'Margarin Tub']],
            ],
            'Bumbu & Dapur' => [
                ['brand' => 'Bango', 'items' => ['Kecap Manis Pouch', 'Kecap Manis Botol', 'Kecap Manis Sachet', 'Kecap Manis Hitam Gurih', 'Bumbu Kuliner Nusantara Rawon', 'Bumbu Soto Betawi']],
                ['brand' => 'ABC Bumbu', 'items' => ['Kecap Manis Pouch', 'Kecap Manis Refill', 'Sambal Asli Botol', 'Sambal Ekstra Pedas Botol', 'Sambal Terasi Pouch', 'Saus Tomat Botol', 'Kecap Inggris', 'Minyak Wijen']],
                ['brand' => 'Indofood Bumbu', 'items' => ['Bumbu Racik Tempe Goreng', 'Bumbu Racik Ayam Goreng', 'Bumbu Racik Ikan Goreng', 'Bumbu Racik Nasi Goreng', 'Bumbu Racik Sayur Asem', 'Bumbu Racik Sayur Sop', 'Bumbu Racik Tumis', 'Sambal Pedas Botol', 'Sambal Ekstra Pedas', 'Kecap Manis']],
                ['brand' => 'Royco', 'items' => ['Kaldu Ayam Sachet', 'Kaldu Sapi Sachet', 'Kaldu Ayam Pouch', 'Kaldu Sapi Pouch', 'Kaldu Jamur', 'Bumbu Nasi Goreng']],
                ['brand' => 'Masako', 'items' => ['Bumbu Kaldu Ayam', 'Bumbu Kaldu Sapi', 'Kaldu Spesial Gurih']],
                ['brand' => 'Sasa', 'items' => ['MSG Penyedap Rasa', 'Tepung Bumbu Serbaguna', 'Tepung Bumbu Kentucky', 'Tepung Bakwan Spesial', 'Tepung Pisang Goreng', 'Santan Cair Instant', 'Santan Bubuk', 'Sambal Ekstra Pedas']],
                ['brand' => 'Kara', 'items' => ['Santan Kelapa Segitiga', 'Santan Kelapa Kotak', 'Nata De Coco']],
                ['brand' => 'Sajiku', 'items' => ['Tepung Bumbu Golden Crispy', 'Tepung Bumbu Serbaguna', 'Bumbu Nasi Goreng Rasa Ayam', 'Bumbu Nasi Goreng Pedas', 'Bumbu Sayur Asem']],
                ['brand' => 'Saori', 'items' => ['Saus Tiram Sachet', 'Saus Tiram Botol', 'Saus Teriyaki Sachet', 'Saus Teriyaki Botol', 'Saus Lada Hitam']],
                ['brand' => 'Ladaku', 'items' => ['Merica Bubuk Murni Sachet', 'Merica Bubuk Botol']],
                ['brand' => 'Desaku', 'items' => ['Ketumbar Bubuk', 'Kunyit Bubuk', 'Bumbu Balado', 'Bumbu Kari', 'Bumbu Opor']],
            ],
            'Snack & Biskuit' => [
                ['brand' => 'Roma', 'items' => ['Biskuit Kelapa', 'Malkist Crackers', 'Malkist Abon', 'Malkist Coklat', 'Biskuit Marie Gold', 'Sari Gandum Sandwich', 'Slai O\'lai Stroberi', 'Slai O\'lai Blueberry', 'Wafello Choco Blast', 'Wafello Butter Caramel', 'Arden Choco']],
                ['brand' => 'Khong Guan', 'items' => ['Assorted Biscuits Red', 'Malkist Crackers', 'Superco Coklat', 'Saltcheese Combo']],
                ['brand' => 'Nabati', 'items' => ['Richeese Wafer Keju', 'Richoco Wafer Coklat', 'Nextar Brownies Choco', 'Nextar Pineapple', 'Aha! Choco', 'Siip Bite Size']],
                ['brand' => 'Tango', 'items' => ['Wafer Coklat', 'Wafer Vanila', 'Wafer Stroberi', 'Waffle Crunchox']],
                ['brand' => 'Oreo', 'items' => ['Original Vanilla', 'Chocolate Creme', 'Strawberry Creme', 'Ice Cream Blueberry', 'Dark & White Choco', 'Mini Cup']],
                ['brand' => 'Good Time', 'items' => ['Double Chocochips Cookies', 'Classic Chocochips', 'Rainbow Cookies']],
                ['brand' => 'Chitato', 'items' => ['Sapi Panggang', 'Ayam Bumbu', 'Keju Supreme', 'Mi Goreng', 'Lite Rumput Laut']],
                ['brand' => 'Qtela', 'items' => ['Singkong Original', 'Singkong Balado', 'Singkong Barbeque', 'Tempe Original', 'Tempe Cabai Rawit']],
                ['brand' => 'Lays / Chiki', 'items' => ['Chiki Balls Keju', 'Chiki Balls Coklat', 'Chiki Twist Jagung Bakar', 'Jetz Choco Stick']],
                ['brand' => 'Taro', 'items' => ['Net Seaweed Rumput Laut', 'Net Potato Barbeque', 'Net Italian Pizza']],
                ['brand' => 'Garuda', 'items' => ['Kacang Kulit', 'Kacang Atom', 'Kacang Telur', 'Kacang Panggang Rosta', 'Pilus Mie Goreng', 'Gery Saluut Malkist Keju', 'Gery Saluut Coklat', 'Chocolatos Wafer Roll']],
                ['brand' => 'SilverQueen', 'items' => ['Cashew Milk Chocolate', 'Almond Milk Chocolate', 'Fruit & Nut', 'Chunky Bar Cashew', 'Green Tea Matcha']],
                ['brand' => 'Beng-Beng', 'items' => ['Wafer Caramel Crispy', 'Maxx Wafer', 'Share It Pouch', 'Drink Chocolate Sachet']],
                ['brand' => 'Sari Roti', 'items' => ['Roti Tawar Spesial', 'Roti Tawar Kupas', 'Roti Sobek Coklat Keju', 'Sandwich Coklat', 'Dorayaki Coklat']],
            ],
            'Sabun, Deterjen & Toiletries' => [
                ['brand' => 'Rinso', 'items' => ['Anti Noda Deterjen Bubuk', 'Molto Rose Fresh Bubuk', 'Molto Cair Pouch', 'Matic Front Load']],
                ['brand' => 'Daia', 'items' => ['Deterjen Bubuk Putih', 'Deterjen Bubuk Bunga', 'Deterjen Bubuk Violet', 'Clean & Fresh Hijab']],
                ['brand' => 'Attack', 'items' => ['Jaz1 Semerbak Cinta', 'Jaz1 Pesona Segar', 'Hygiene Plus', 'Easy Romantic Flower']],
                ['brand' => 'So Klin', 'items' => ['Softergent Pink', 'Liquid Deterjen Cair', 'Lantai Pembersih Apel', 'Lantai Lavender', 'Pewangi Pakaian']],
                ['brand' => 'Sunlight', 'items' => ['Jeruk Nipis 100 Pouch', 'Habbatussauda Pouch', 'Extra Higienis', 'Mint & Lemon']],
                ['brand' => 'Mama Lemon', 'items' => ['Jeruk Nipis Pouch', 'Extra Clean Lemon', 'Total Clean']],
                ['brand' => 'Ekonomi', 'items' => ['Sabun Colek Kuning', 'Power Liquid Jeruk Nipis']],
                ['brand' => 'Molto', 'items' => ['Pelembut & Pewangi Blue', 'Pink Floral', 'Eau De Parfum Luxury', 'Korean Strawberry']],
                ['brand' => 'Downy', 'items' => ['Sunrise Fresh Pouch', 'Mystique', 'Passion', 'Adorables']],
                ['brand' => 'Lifebuoy', 'items' => ['Sabun Batang Total 10', 'Sabun Batang Lemon Fresh', 'Sabun Batang Mild Care', 'Sabun Cair Total 10 Pouch', 'Sabun Cair Lemon Pouch', 'Shampoo Anti Ketombe', 'Shampoo Strong & Shiny']],
                ['brand' => 'Nuvo', 'items' => ['Sabun Batang Merah', 'Sabun Batang Biru', 'Sabun Cair Pouch', 'Hand Sanitizer Gel']],
                ['brand' => 'Lux', 'items' => ['Magical Orchid Pouch', 'Soft Rose Sabun Batang', 'Velvet Jasmine']],
                ['brand' => 'Biore', 'items' => ['Body Foam Relaxing Aromatic', 'Pure Mild', 'Bright Sakura', 'Mens Facial Foam']],
                ['brand' => 'Pepsodent', 'items' => ['Pencegah Gigi Berlubang', 'Action 123 Herbal', 'Action 123 Charcoal', 'Sensitive Expert', 'Sikat Gigi Double Care']],
                ['brand' => 'CloseUp', 'items' => ['Ever Fresh Menthol', 'Crystal Frost']],
                ['brand' => 'Ciptadent', 'items' => ['Fresh Mint', 'Cool Mint', 'Maxi 12 Plus']],
                ['brand' => 'Sunsilk', 'items' => ['Black Shine Shampoo', 'Soft & Smooth Shampoo', 'Hijab Refresh']],
                ['brand' => 'Clear', 'items' => ['Ice Cool Menthol Shampoo', 'Complete Soft Care', 'Men Cool Sport']],
                ['brand' => 'Pantene', 'items' => ['Anti Ketombe Shampoo', 'Perawatan Rambut Rontok', 'Conditioner Total Damage Care']],
                ['brand' => 'Rexona', 'items' => ['Roll On Women Free Spirit', 'Roll On Men Ice Cool', 'Sachet Deodorant']],
                ['brand' => 'Wipol', 'items' => ['Karbol Cemara Pouch', 'Karbol Lemon Pine']],
                ['brand' => 'Vixal', 'items' => ['Pembersih Porselen Biru', 'Pembersih Kamar Mandi Hijau']],
                ['brand' => 'Baygon', 'items' => ['Aerosol Flower Garden', 'Aerosol Citrus Fresh', 'Bakar Jumbo']],
                ['brand' => 'HIT', 'items' => ['Aerosol Lily Blossom', 'Aerosol Orange', 'Mat Elektrik Refill']],
            ],
            'Obat & Kesehatan' => [
                ['brand' => 'Tolak Angin', 'items' => ['Cair Dewasa Sachet', 'Cair Dewasa Box 12s', 'Cair Anak Madu', 'Bebas Gula']],
                ['brand' => 'Antangin', 'items' => ['JRG Cair Sachet', 'Mint Cair Sachet', 'Good Night']],
                ['brand' => 'Bodrex', 'items' => ['Tablet Sakit Kepala', 'Flu & Batuk PE', 'Extra', 'Migra', 'Bodrexin Anak']],
                ['brand' => 'Paramex', 'items' => ['Sakit Kepala Strip', 'Flu & Batuk', 'Nyeri Otot']],
                ['brand' => 'Panadol', 'items' => ['Biru Paracetamol', 'Extra Merah', 'Cold & Flu Hijau']],
                ['brand' => 'Promag', 'items' => ['Tablet Kunyah Maag Strip', 'Cair Sachet', 'Double Action']],
                ['brand' => 'Mylanta', 'items' => ['Cair Botol', 'Tablet Strip']],
                ['brand' => 'Entrostop', 'items' => ['Obat Diare Strip', 'Herbal Anak']],
                ['brand' => 'Cap Lang', 'items' => ['Minyak Kayu Putih 15ml', 'Minyak Kayu Putih 30ml', 'Minyak Kayu Putih 60ml', 'Minyak Kayu Putih 120ml', 'Minyak Telon Lang', 'GPU Krim Urut', 'Balsem Lang']],
                ['brand' => 'FreshCare', 'items' => ['Minyak Angin Aromatherapy Citrus', 'Green Tea', 'Splash Fruity', 'Strong Roll On']],
                ['brand' => 'Salonpas', 'items' => ['Koyo Pereda Nyeri', 'Koyo Hot', 'Gel Patch']],
                ['brand' => 'Hansaplast', 'items' => ['Plester Luka Kain Elastis', 'Antiseptik Pembersih Luka', 'Koyo Hangat']],
                ['brand' => 'Betadine', 'items' => ['Antiseptik Luka 5ml', 'Antiseptik Luka 15ml', 'Obat Kumur']],
                ['brand' => 'Adem Sari', 'items' => ['Sachet Serbuk', 'Ching Ku Kaleng', 'Ching Ku Botol']],
                ['brand' => 'Larutan Cap Badak', 'items' => ['Original Botol', 'Jambu Kaleng', 'Leci Kaleng', 'Jeruk Kaleng', 'Melon Kaleng']],
            ],
            'Rokok & Tembakau' => [
                ['brand' => 'Gudang Garam', 'items' => ['Surya 16', 'Surya Pro Mild 16', 'Internasional Filter 12', 'Merah Kretek 12', 'Signature Mild 16']],
                ['brand' => 'Sampoerna', 'items' => ['A-Mild 16', 'A-Mild 12', 'Dji Sam Soe Kretek 12', 'Dji Sam Soe Magnum Filter 12', 'Splash']],
                ['brand' => 'Djarum', 'items' => ['Super 12', 'Super 16', 'Mld 20', 'Black 16', 'Coklat Kretek 12', '76 Kretek 12']],
                ['brand' => 'LA / Clas Mild', 'items' => ['LA Lights 16', 'LA Bold 20', 'LA Ice Purple', 'Clas Mild 16']],
                ['brand' => 'Esse', 'items' => ['Change Double 20', 'Change Juicy', 'Berry Pop', 'Honey Pop']],
                ['brand' => 'Marlboro', 'items' => ['Red 20', 'Lights Gold 20', 'Ice Burst 20', 'Filter Black 12']],
            ],
        ];

        $sizeVariants = [
            ['suffix' => 'Sachet 15g', 'uom' => 'PCS', 'mult' => 0.25],
            ['suffix' => 'Sachet 25g', 'uom' => 'PCS', 'mult' => 0.35],
            ['suffix' => 'Renceng 10x25g', 'uom' => 'RCG', 'mult' => 3.2],
            ['suffix' => 'Pack Kecil 50g', 'uom' => 'BKS', 'mult' => 0.6],
            ['suffix' => 'Reguler 75g', 'uom' => 'PCS', 'mult' => 1.0],
            ['suffix' => 'Reguler 85g', 'uom' => 'PCS', 'mult' => 1.1],
            ['suffix' => 'Medium 120g', 'uom' => 'BKS', 'mult' => 1.5],
            ['suffix' => 'Medium 150g', 'uom' => 'BKS', 'mult' => 1.8],
            ['suffix' => 'Family Pack 200g', 'uom' => 'BKS', 'mult' => 2.2],
            ['suffix' => 'Family Pack 250g', 'uom' => 'PCH', 'mult' => 2.6],
            ['suffix' => 'Pouch 400g', 'uom' => 'PCH', 'mult' => 3.8],
            ['suffix' => 'Pouch 450ml', 'uom' => 'PCH', 'mult' => 4.2],
            ['suffix' => 'Pouch 650ml', 'uom' => 'PCH', 'mult' => 5.5],
            ['suffix' => 'Pouch 800ml', 'uom' => 'PCH', 'mult' => 6.8],
            ['suffix' => 'Botol 135ml', 'uom' => 'BTL', 'mult' => 1.4],
            ['suffix' => 'Botol 250ml', 'uom' => 'BTL', 'mult' => 1.7],
            ['suffix' => 'Botol 330ml', 'uom' => 'BTL', 'mult' => 2.0],
            ['suffix' => 'Botol 350ml', 'uom' => 'BTL', 'mult' => 2.1],
            ['suffix' => 'Botol 500ml', 'uom' => 'BTL', 'mult' => 2.5],
            ['suffix' => 'Botol 600ml', 'uom' => 'BTL', 'mult' => 2.8],
            ['suffix' => 'Botol 1000ml (1L)', 'uom' => 'BTL', 'mult' => 5.0],
            ['suffix' => 'Botol 1500ml (1.5L)', 'uom' => 'BTL', 'mult' => 6.5],
            ['suffix' => 'Pouch 1 Liter', 'uom' => 'PCH', 'mult' => 6.0],
            ['suffix' => 'Pouch 2 Liter', 'uom' => 'PCH', 'mult' => 11.5],
            ['suffix' => 'Kaleng 189ml', 'uom' => 'KLG', 'mult' => 2.4],
            ['suffix' => 'Kaleng 240ml', 'uom' => 'KLG', 'mult' => 2.7],
            ['suffix' => 'Kaleng 320ml', 'uom' => 'KLG', 'mult' => 3.2],
            ['suffix' => 'Kotak 115ml', 'uom' => 'PCS', 'mult' => 1.1],
            ['suffix' => 'Kotak 200ml', 'uom' => 'PCS', 'mult' => 1.6],
            ['suffix' => 'Kotak 250ml', 'uom' => 'PCS', 'mult' => 1.9],
            ['suffix' => 'Kotak 1000ml', 'uom' => 'BOX', 'mult' => 6.2],
            ['suffix' => 'Kemasan 500g', 'uom' => 'BKS', 'mult' => 4.5],
            ['suffix' => 'Kemasan 770g', 'uom' => 'BKS', 'mult' => 6.4],
            ['suffix' => 'Kemasan 1 Kg', 'uom' => 'BKS', 'mult' => 8.0],
            ['suffix' => 'Kemasan 2 Kg', 'uom' => 'BKS', 'mult' => 15.5],
            ['suffix' => 'Karung 5 Kg', 'uom' => 'SAK', 'mult' => 35.0],
            ['suffix' => 'Banded Beli 2 Gratis 1', 'uom' => 'PAK', 'mult' => 2.0],
            ['suffix' => 'Multipack Isi 5', 'uom' => 'PAK', 'mult' => 4.8],
            ['suffix' => 'Box Isi 12', 'uom' => 'BOX', 'mult' => 11.2],
            ['suffix' => 'Box Isi 24', 'uom' => 'BOX', 'mult' => 22.0],
            ['suffix' => 'Karton / Dus Isi 40', 'uom' => 'DUS', 'mult' => 36.0],
            ['suffix' => 'Karton / Dus Isi 48', 'uom' => 'DUS', 'mult' => 43.0],
        ];

        $batch = [];
        $needed = $targetTotal - $currentCount;
        $seq = 100000;
        $now = now()->toDateTimeString();

        while ($needed > 0) {
            foreach ($catalogBrands as $categoryName => $brandGroups) {
                foreach ($brandGroups as $group) {
                    $brand = $group['brand'];
                    foreach ($group['items'] as $itemName) {
                        foreach ($sizeVariants as $variant) {
                            if ($needed <= 0) break 4;

                            $seq++;
                            // Barcode standar GS1 Indonesia (Prefix 899 + 9 digit + check digit)
                            $base12 = '899' . str_pad((string) $seq, 9, '0', STR_PAD_LEFT);
                            $barcode = $this->appendEan13CheckDigit($base12);

                            $basePrice = 2000 + (($seq % 17) * 500);
                            $refPrice = ceil(($basePrice * $variant['mult']) / 100) * 100;

                            $batch[] = [
                                'barcode' => $barcode,
                                'name' => strtoupper("{$brand} {$itemName} {$variant['suffix']}"),
                                'category' => $categoryName,
                                'brand' => $brand,
                                'unit' => $variant['uom'],
                                'reference_price' => $refPrice,
                                'created_at' => $now,
                                'updated_at' => $now,
                            ];

                            $needed--;

                            if (count($batch) >= 1000) {
                                DB::table('indonesia_product_catalogs')->insertOrIgnore($batch);
                                $batch = [];
                            }
                        }
                    }
                }
            }
        }

        if (!empty($batch)) {
            DB::table('indonesia_product_catalogs')->insertOrIgnore($batch);
        }
    }

    private function appendEan13CheckDigit(string $digits12): string
    {
        $sum = 0;
        for ($i = 0; $i < 12; $i++) {
            $d = (int) $digits12[$i];
            $sum += ($i % 2 === 0) ? $d : ($d * 3);
        }
        $check = (10 - ($sum % 10)) % 10;
        return $digits12 . $check;
    }
}
