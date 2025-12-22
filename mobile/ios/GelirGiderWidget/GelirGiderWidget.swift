import WidgetKit
import SwiftUI

// MARK: - Data Models
struct BalanceEntry: TimelineEntry {
    let date: Date
    let balance: Double
    let income: Double
    let expense: Double
    let currency: String
}

// MARK: - Provider
struct BalanceProvider: TimelineProvider {
    func placeholder(in context: Context) -> BalanceEntry {
        BalanceEntry(
            date: Date(),
            balance: 24567.89,
            income: 35420.00,
            expense: 10852.11,
            currency: "₺"
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (BalanceEntry) -> ()) {
        let entry = placeholder(in: context)
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<BalanceEntry>) -> ()) {
        // Fetch data from API or UserDefaults
        let entry = fetchBalanceData()

        // Update every 15 minutes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))

        completion(timeline)
    }

    private func fetchBalanceData() -> BalanceEntry {
        // In production, fetch from shared UserDefaults or API
        let defaults = UserDefaults(suiteName: "group.com.gelirgider.app")
        let balance = defaults?.double(forKey: "balance") ?? 24567.89
        let income = defaults?.double(forKey: "income") ?? 35420.00
        let expense = defaults?.double(forKey: "expense") ?? 10852.11

        return BalanceEntry(
            date: Date(),
            balance: balance,
            income: income,
            expense: expense,
            currency: "₺"
        )
    }
}

// MARK: - Small Widget View
struct SmallWidgetView: View {
    var entry: BalanceEntry

    var body: some View {
        ZStack {
            // Gradient Background
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(red: 99/255, green: 102/255, blue: 241/255),
                    Color(red: 139/255, green: 92/255, blue: 246/255)
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            VStack(alignment: .leading, spacing: 4) {
                Text("Bakiye")
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.8))

                Text("\(entry.currency)\(formatNumber(entry.balance))")
                    .font(.system(size: 20, weight: .bold, design: .rounded))
                    .foregroundColor(.white)

                Spacer()

                HStack {
                    Image(systemName: "arrow.up.circle.fill")
                        .foregroundColor(.green)
                    Text("\(entry.currency)\(formatNumberShort(entry.income))")
                        .font(.caption2)
                        .foregroundColor(.white)
                }
            }
            .padding()
        }
    }

    private func formatNumber(_ number: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.maximumFractionDigits = 0
        return formatter.string(from: NSNumber(value: number)) ?? "0"
    }

    private func formatNumberShort(_ number: Double) -> String {
        if number >= 1000 {
            return String(format: "%.1fk", number / 1000)
        }
        return String(format: "%.0f", number)
    }
}

// MARK: - Medium Widget View
struct MediumWidgetView: View {
    var entry: BalanceEntry

    var body: some View {
        ZStack {
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(red: 99/255, green: 102/255, blue: 241/255),
                    Color(red: 139/255, green: 92/255, blue: 246/255),
                    Color(red: 236/255, green: 72/255, blue: 153/255)
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            HStack(spacing: 16) {
                // Balance Card
                VStack(alignment: .leading, spacing: 8) {
                    Text("Toplam Bakiye")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.8))

                    Text("\(entry.currency)\(formatNumber(entry.balance))")
                        .font(.system(size: 24, weight: .bold, design: .rounded))
                        .foregroundColor(.white)

                    Text("Güncelleme: \(formatTime(entry.date))")
                        .font(.caption2)
                        .foregroundColor(.white.opacity(0.6))
                }

                Spacer()

                // Stats
                VStack(spacing: 12) {
                    StatRow(
                        icon: "arrow.up.circle.fill",
                        label: "Gelir",
                        value: "\(entry.currency)\(formatNumberShort(entry.income))",
                        color: .green
                    )

                    StatRow(
                        icon: "arrow.down.circle.fill",
                        label: "Gider",
                        value: "\(entry.currency)\(formatNumberShort(entry.expense))",
                        color: .red
                    )
                }
            }
            .padding()
        }
    }

    private func formatNumber(_ number: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.maximumFractionDigits = 2
        return formatter.string(from: NSNumber(value: number)) ?? "0"
    }

    private func formatNumberShort(_ number: Double) -> String {
        if number >= 1000 {
            return String(format: "%.1fk", number / 1000)
        }
        return String(format: "%.0f", number)
    }

    private func formatTime(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

// MARK: - Stat Row Component
struct StatRow: View {
    let icon: String
    let label: String
    let value: String
    let color: Color

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .foregroundColor(color)
                .font(.system(size: 16))

            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.caption2)
                    .foregroundColor(.white.opacity(0.7))
                Text(value)
                    .font(.caption)
                    .bold()
                    .foregroundColor(.white)
            }
        }
    }
}

// MARK: - Large Widget View
struct LargeWidgetView: View {
    var entry: BalanceEntry

    var body: some View {
        ZStack {
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(red: 99/255, green: 102/255, blue: 241/255),
                    Color(red: 139/255, green: 92/255, blue: 246/255),
                    Color(red: 236/255, green: 72/255, blue: 153/255)
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            VStack(alignment: .leading, spacing: 16) {
                // Header
                VStack(alignment: .leading, spacing: 4) {
                    Text("Gelir-Gider")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.8))

                    Text("Toplam Bakiye")
                        .font(.headline)
                        .foregroundColor(.white)

                    Text("\(entry.currency)\(formatNumber(entry.balance))")
                        .font(.system(size: 32, weight: .bold, design: .rounded))
                        .foregroundColor(.white)
                }

                Divider()
                    .background(Color.white.opacity(0.3))

                // Stats Grid
                HStack(spacing: 16) {
                    StatCard(
                        icon: "arrow.up.circle.fill",
                        label: "Toplam Gelir",
                        value: "\(entry.currency)\(formatNumber(entry.income))",
                        color: .green
                    )

                    StatCard(
                        icon: "arrow.down.circle.fill",
                        label: "Toplam Gider",
                        value: "\(entry.currency)\(formatNumber(entry.expense))",
                        color: .red
                    )
                }

                Spacer()

                // Footer
                HStack {
                    Image(systemName: "clock")
                        .foregroundColor(.white.opacity(0.6))
                        .font(.caption2)
                    Text("Güncelleme: \(formatDateTime(entry.date))")
                        .font(.caption2)
                        .foregroundColor(.white.opacity(0.6))
                }
            }
            .padding()
        }
    }

    private func formatNumber(_ number: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.maximumFractionDigits = 2
        return formatter.string(from: NSNumber(value: number)) ?? "0"
    }

    private func formatDateTime(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .short
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

// MARK: - Stat Card Component
struct StatCard: View {
    let icon: String
    let label: String
    let value: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Image(systemName: icon)
                .foregroundColor(color)
                .font(.system(size: 24))

            Text(label)
                .font(.caption)
                .foregroundColor(.white.opacity(0.8))

            Text(value)
                .font(.system(size: 18, weight: .bold, design: .rounded))
                .foregroundColor(.white)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color.white.opacity(0.15))
        .cornerRadius(12)
    }
}

// MARK: - Widget Configuration
@main
struct GelirGiderWidget: Widget {
    let kind: String = "GelirGiderWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: BalanceProvider()) { entry in
            GelirGiderWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Bakiye")
        .description("Gelir-gider bakiyenizi takip edin")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

// MARK: - Entry View
struct GelirGiderWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    var entry: BalanceEntry

    var body: some View {
        switch family {
        case .systemSmall:
            SmallWidgetView(entry: entry)
        case .systemMedium:
            MediumWidgetView(entry: entry)
        case .systemLarge:
            LargeWidgetView(entry: entry)
        @unknown default:
            SmallWidgetView(entry: entry)
        }
    }
}

// MARK: - Preview
struct GelirGiderWidget_Previews: PreviewProvider {
    static var previews: some View {
        let entry = BalanceEntry(
            date: Date(),
            balance: 24567.89,
            income: 35420.00,
            expense: 10852.11,
            currency: "₺"
        )

        Group {
            GelirGiderWidgetEntryView(entry: entry)
                .previewContext(WidgetPreviewContext(family: .systemSmall))

            GelirGiderWidgetEntryView(entry: entry)
                .previewContext(WidgetPreviewContext(family: .systemMedium))

            GelirGiderWidgetEntryView(entry: entry)
                .previewContext(WidgetPreviewContext(family: .systemLarge))
        }
    }
}
