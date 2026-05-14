import {
  ShieldCheck,
  Eye,
  TrendingUp,
  Wifi,
  AlertTriangle,
  BarChart3,
  Lightbulb,
  Users,
  Building2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const problemCards = [
  {
    icon: AlertTriangle,
    accent: "text-accent-red",
    bg: "bg-accent-red/10",
    border: "border-accent-red/20",
    title: "Risiko Pemadaman Massal",
    description:
      "Pemadaman 4 Agustus 2019 berdampak pada 100 juta+ penduduk dan menyebabkan kerugian Rp822,98 miliar — akibat langsung dari prakiraan yang tidak akurat.",
  },
  {
    icon: Eye,
    accent: "text-accent-orange",
    bg: "bg-accent-orange/10",
    border: "border-accent-orange/20",
    title: "Keputusan Tanpa Transparansi",
    description:
      "Sistem prediksi saat ini hanya memberikan angka tanpa penjelasan — tidak memadai untuk keputusan investasi infrastruktur bernilai triliunan rupiah.",
  },
  {
    icon: TrendingUp,
    accent: "text-accent-cyan",
    bg: "bg-accent-cyan/10",
    border: "border-accent-cyan/20",
    title: "Pertumbuhan Permintaan 67%",
    description:
      "Kebutuhan listrik Indonesia diproyeksikan tumbuh dari 306 TWh (2024) ke 511 TWh pada 2034. Metode konvensional tidak mampu mengimbangi pertumbuhan ini.",
  },
];

const features = [
  {
    title: "Prediksi Akurat & Terpercaya",
    description:
      "Sistem hybrid AI menggabungkan analisis tren historis dan koreksi cerdas untuk menghasilkan prakiraan dengan tingkat akurasi 98.48% pada data uji.",
    icon: BarChart3,
    accent: "text-accent-green",
    bg: "bg-accent-green/10",
    border: "border-accent-green/20",
  },
  {
    title: "Setiap Prediksi Bisa Dijelaskan",
    description:
      "Tidak ada lagi \"kotak hitam\". Setiap hasil prediksi dilengkapi 3 faktor utama penyebab — dalam bahasa yang mudah dipahami, bukan kode teknis.",
    icon: Lightbulb,
    accent: "text-accent-purple",
    bg: "bg-accent-purple/10",
    border: "border-accent-purple/20",
  },
  {
    title: "Deteksi Anomali Otomatis",
    description:
      "Sistem menandai data abnormal secara otomatis sebelum prediksi dibuat — mencegah keputusan berdasarkan data sensor yang rusak atau tidak wajar.",
    icon: ShieldCheck,
    accent: "text-accent-red",
    bg: "bg-accent-red/10",
    border: "border-accent-red/20",
  },
  {
    title: "Simulasi \"Bagaimana Jika\"",
    description:
      "Simulasikan dampak cuaca ekstrem, hari libur nasional, atau lonjakan suhu terhadap kebutuhan listrik — sebelum hal itu terjadi.",
    icon: TrendingUp,
    accent: "text-accent-orange",
    bg: "bg-accent-orange/10",
    border: "border-accent-orange/20",
  },
  {
    title: "100% Offline & Berdaulat",
    description:
      "Seluruh sistem berjalan secara lokal tanpa ketergantungan pada cloud asing. Kedaulatan digital penuh untuk infrastruktur kritis negara.",
    icon: Wifi,
    accent: "text-accent-cyan",
    bg: "bg-accent-cyan/10",
    border: "border-accent-cyan/20",
  },
  {
    title: "Integritas Data Terjamin",
    description:
      "Arsitektur yang dirancang khusus untuk mencegah kebocoran data antar periode — memastikan setiap metrik evaluasi benar-benar valid dan dapat diaudit.",
    icon: ShieldCheck,
    accent: "text-accent-green",
    bg: "bg-accent-green/10",
    border: "border-accent-green/20",
  },
];

const personas = [
  {
    icon: Users,
    role: "Analis Beban & Dispatch",
    freq: "Harian / Per Jam",
    description:
      "Memvalidasi prediksi beban puncak sebelum mengalokasikan cadangan pembangkit dan memastikan pasokan listrik tidak terganggu.",
  },
  {
    icon: Building2,
    role: "Manajer Perencanaan Distribusi",
    freq: "Bulanan / Kuartalan",
    description:
      "Merencanakan alokasi kapasitas dan jadwal pemeliharaan di seluruh wilayah PLN berdasarkan prakiraan permintaan.",
  },
  {
    icon: ShieldCheck,
    role: "Direktur Strategis / Kementerian ESDM",
    freq: "Tahunan / Dekade",
    description:
      "Menjalankan simulasi kebijakan dan skenario untuk keputusan investasi infrastruktur energi jangka panjang.",
  },
];

export function Features() {
  return (
    <>
      {/* PROBLEM SECTION */}
      <section
        id="problem"
        className="py-24 border-b border-border/50"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-cyan mb-3">
              Mengapa Ini Penting
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Tantangan Tersembunyi dalam Pengelolaan Jaringan Listrik
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {problemCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <Card
                  key={i}
                  className="bg-popover/40 backdrop-blur border-l-4 border-l-accent-red/60 border border-border transition-all hover:border-muted-foreground/30 hover:shadow-lg"
                >
                  <CardHeader>
                    <div
                      className={`size-10 rounded-lg flex items-center justify-center mb-4 border ${card.bg} ${card.border} ${card.accent}`}
                    >
                      <Icon size={20} strokeWidth={2} />
                    </div>
                    <CardTitle className="text-lg">{card.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm text-text-secondary leading-relaxed">
                      {card.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS - simplified for government audience */}
      <section
        id="how-it-works"
        className="py-24 bg-card/30 border-y border-border/50"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-cyan mb-3">
              Cara Kerja
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Tiga Langkah Menuju Prediksi yang Dapat Dipercaya
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Dari data mentah hingga rekomendasi yang bisa ditindaklanjuti — dalam hitungan detik.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Kumpulkan Data",
                desc: "Mengintegrasikan data dari BPS, BMKG, Bank Dunia, dan kalender hari libur nasional secara otomatis.",
                color: "text-accent-cyan",
                borderColor: "border-accent-cyan/30",
              },
              {
                step: "02",
                title: "Analisis & Prediksi",
                desc: "Sistem AI menganalisis pola historis, cuaca, dan faktor ekonomi untuk menghasilkan prakiraan permintaan listrik yang akurat.",
                color: "text-accent-green",
                borderColor: "border-accent-green/30",
              },
              {
                step: "03",
                title: "Jelaskan & Rekomendasikan",
                desc: "Setiap prediksi dilengkapi penjelasan 3 faktor utama dalam Bahasa Indonesia — siap untuk laporan dan presentasi.",
                color: "text-accent-purple",
                borderColor: "border-accent-purple/30",
              },
            ].map((item, i) => (
              <div
                key={i}
                className={`relative rounded-xl border ${item.borderColor} bg-popover/40 backdrop-blur p-8 transition-all hover:shadow-lg`}
              >
                <div
                  className={`text-5xl font-extrabold ${item.color} opacity-20 absolute top-4 right-6`}
                >
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3 mt-6">
                  {item.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES - government-friendly language */}
      <section id="features" className="py-24 border-b border-border/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-cyan mb-3">
              Kemampuan Platform
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Dirancang untuk Pengambil Keputusan
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Setiap fitur dibangun untuk menjawab kebutuhan nyata pengelolaan jaringan listrik nasional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={i}
                  className="bg-popover/40 backdrop-blur border border-border transition-all hover:border-muted-foreground/30 hover:shadow-lg hover:-translate-y-1"
                >
                  <CardHeader>
                    <div
                      className={`size-10 rounded-lg flex items-center justify-center mb-4 border ${feature.bg} ${feature.border} ${feature.accent}`}
                    >
                      <Icon size={20} strokeWidth={2} />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm text-text-secondary leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* PERFORMANCE - simplified for non-technical audience */}
      <section id="performance" className="py-24 bg-card/30 border-y border-border/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-cyan mb-3">
              Hasil Terukur
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Akurasi yang Membangun Kepercayaan
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Teruji pada data historis nyata Indonesia — bukan simulasi laboratorium.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto mb-12">
            <div className="rounded-xl border border-border/50 bg-popover/40 backdrop-blur p-6 text-center">
              <div className="text-4xl font-bold text-accent-cyan font-mono">98.48%</div>
              <div className="text-sm text-muted-foreground mt-2">Tingkat Akurasi</div>
              <div className="text-xs text-text-faint mt-1">(MAPE 1.52%)</div>
            </div>
            <div className="rounded-xl border border-border/50 bg-popover/40 backdrop-blur p-6 text-center">
              <div className="text-4xl font-bold text-accent-green font-mono">10.4%</div>
              <div className="text-sm text-muted-foreground mt-2">Lebih Baik dari Metode Konvensional</div>
            </div>
            <div className="rounded-xl border border-border/50 bg-popover/40 backdrop-blur p-6 text-center">
              <div className="text-4xl font-bold text-accent-purple font-mono">&lt;2 dtk</div>
              <div className="text-sm text-muted-foreground mt-2">Waktu Analisis per Prediksi</div>
              <div className="text-xs text-text-faint mt-1">Tanpa GPU — cukup laptop biasa</div>
            </div>
          </div>

          {/* Simplified comparison */}
          <div className="max-w-2xl mx-auto rounded-xl border border-border/50 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-accent-cyan/10">
                  <th className="text-left p-4 font-semibold text-foreground">Metrik</th>
                  <th className="text-center p-4 font-semibold text-muted-foreground">Metode Lama</th>
                  <th className="text-center p-4 font-semibold text-accent-cyan">Castricity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                <tr className="bg-popover/30">
                  <td className="p-4 text-text-secondary">Rata-rata Kesalahan (MAE)</td>
                  <td className="p-4 text-center text-muted-foreground">12.020 MWh</td>
                  <td className="p-4 text-center text-accent-cyan font-semibold">11.271 MWh ✓</td>
                </tr>
                <tr className="bg-popover/20">
                  <td className="p-4 text-text-secondary">Tingkat Akurasi (MAPE)</td>
                  <td className="p-4 text-center text-muted-foreground">98.34%</td>
                  <td className="p-4 text-center text-accent-cyan font-semibold">98.48% ✓</td>
                </tr>
                <tr className="bg-popover/30">
                  <td className="p-4 text-text-secondary">Penjelasan Prediksi</td>
                  <td className="p-4 text-center text-accent-red">Tidak ada ✗</td>
                  <td className="p-4 text-center text-accent-green font-semibold">3 Faktor Utama ✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* WHO USES THIS */}
      <section className="py-24 border-b border-border/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-cyan mb-3">
              Siapa yang Menggunakan
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Dibangun untuk Setiap Level Pengambil Keputusan
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {personas.map((persona, i) => {
              const Icon = persona.icon;
              return (
                <Card
                  key={i}
                  className="bg-popover/40 backdrop-blur border border-border transition-all hover:border-accent-cyan/30 hover:shadow-lg"
                >
                  <CardHeader>
                    <div className="size-10 rounded-lg flex items-center justify-center mb-4 border border-accent-cyan/20 bg-accent-cyan/10 text-accent-cyan">
                      <Icon size={20} strokeWidth={2} />
                    </div>
                    <CardTitle className="text-lg">{persona.role}</CardTitle>
                    <span className="text-xs font-medium text-accent-cyan uppercase tracking-wider">
                      {persona.freq}
                    </span>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm text-text-secondary leading-relaxed">
                      {persona.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
