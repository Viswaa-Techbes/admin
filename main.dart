import 'package:flutter/material.dart';

void main() {
  runApp(const TechbesDashboardApp());
}

class TechbesDashboardApp extends StatelessWidget {
  const TechbesDashboardApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Techbes Service CRM',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo),
        useMaterial3: true,
        scaffoldBackgroundColor: const Color(0xFFF1F5F9),
      ),
      home: const DashboardHome(),
    );
  }
}

class DashboardHome extends StatefulWidget {
  const DashboardHome({super.key});

  @override
  State<DashboardHome> createState() => _DashboardHomeState();
}

class _DashboardHomeState extends State<DashboardHome> {
  String activePage = 'dashboard';
  bool collapsed = false;

  void _selectPage(String pageId) {
    setState(() {
      activePage = pageId;
    });
  }

  @override
  Widget build(BuildContext context) {
    final pageTitle = pageTitles[activePage] ?? 'Dashboard';

    return Scaffold(
      body: SafeArea(
        child: Row(
          children: [
            _buildSidebar(context),
            Expanded(
              child: Column(
                children: [
                  _buildTopBar(context, pageTitle),
                  Expanded(child: _buildPageContent()),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSidebar(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 220),
      width: collapsed ? 72 : 240,
      decoration: const BoxDecoration(
        color: Color(0xFF0C0E16),
        boxShadow: [BoxShadow(color: Color.fromRGBO(0, 0, 0, 0.08), blurRadius: 20)],
      ),
      child: Column(
        children: [
          const SizedBox(height: 20),
          Padding(
            padding: EdgeInsets.symmetric(horizontal: collapsed ? 14 : 20),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(11),
                    gradient: const LinearGradient(
                      colors: [Color(0xFF6366F1), Color(0xFF06B6D4)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  alignment: Alignment.center,
                  child: const Text('⚡', style: TextStyle(fontSize: 18)),
                ),
                if (!collapsed) ...[
                  const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Text('Techbes', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 15)),
                      SizedBox(height: 2),
                      Text('Service CRM', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 10, letterSpacing: 1.2)),
                    ],
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 20),
          Expanded(
            child: ListView(
              padding: EdgeInsets.symmetric(horizontal: collapsed ? 6 : 8),
              children: navItems.map((item) {
                final isActive = activePage == item.id;
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Material(
                    color: isActive ? const Color.fromRGBO(99, 102, 241, 0.18) : Colors.transparent,
                    borderRadius: BorderRadius.circular(14),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(14),
                      onTap: () => _selectPage(item.id),
                      child: Container(
                        padding: EdgeInsets.symmetric(vertical: 12, horizontal: collapsed ? 14 : 12),
                        decoration: isActive ? BoxDecoration(borderRadius: BorderRadius.circular(14)) : null,
                        child: Row(
                          mainAxisAlignment: collapsed ? MainAxisAlignment.center : MainAxisAlignment.start,
                          children: [
                            Icon(item.icon, size: 20, color: isActive ? const Color(0xFFFFFFFF) : const Color(0xFF94A3B8)),
                            if (!collapsed) ...[
                              const SizedBox(width: 10),
                              Expanded(child: Text(item.label, style: TextStyle(color: isActive ? Colors.white : const Color(0xFF94A3B8), fontWeight: isActive ? FontWeight.w600 : FontWeight.w500))),
                              if (item.badge != null)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(color: const Color(0xFFF43F5E), borderRadius: BorderRadius.circular(99)),
                                  child: Text('${item.badge}', style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w700)),
                                ),
                            ],
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: const BoxDecoration(border: Border(top: BorderSide(color: Color.fromRGBO(255, 255, 255, 0.06)))),
            child: Column(
              children: [
                if (!collapsed)
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: const Color.fromRGBO(255, 255, 255, 0.03), borderRadius: BorderRadius.circular(14)),
                    child: Row(
                      children: const [
                        CircleAvatar(backgroundColor: Color(0xFF6366F1), radius: 15, child: Text('AD', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold))),
                        SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Admin User', style: TextStyle(color: Colors.white, fontSize: 12.5, fontWeight: FontWeight.w600)),
                              Text('Super Admin', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 10.5)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                const SizedBox(height: 8),
                ElevatedButton(
                  onPressed: () => setState(() => collapsed = !collapsed),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color.fromRGBO(255, 255, 255, 0.03),
                    foregroundColor: const Color(0xFF94A3B8),
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    side: const BorderSide(color: Color.fromRGBO(255, 255, 255, 0.06)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(collapsed ? Icons.arrow_forward_ios : Icons.arrow_back_ios, size: 16),
                      if (!collapsed) const SizedBox(width: 6),
                      if (!collapsed) const Text('Collapse', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTopBar(BuildContext context, String pageTitle) {
    return Container(
      height: 70,
      padding: const EdgeInsets.symmetric(horizontal: 24),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: Color(0xFFE2E8F0))),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(pageTitle, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFF0F172A))),
          ),
          Container(
            width: 240,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFFE2E8F0))),
            child: Row(
              children: const [
                Icon(Icons.search, color: Color(0xFF94A3B8), size: 18),
                SizedBox(width: 10),
                Expanded(
                  child: Text('Search anything…', style: TextStyle(color: Color(0xFF64748B), fontSize: 13)),
                ),
                SizedBox(width: 8),
                Text('⌘K', style: TextStyle(fontSize: 10, color: Color(0xFFCBD5E1))),
              ],
            ),
          ),
          const SizedBox(width: 16),
          Stack(
            children: [
              IconButton(onPressed: () {}, icon: const Icon(Icons.notifications_none, color: Color(0xFF64748B))),
              Positioned(right: 8, top: 8, child: Container(width: 8, height: 8, decoration: const BoxDecoration(color: Color(0xFFF43F5E), shape: BoxShape.circle, border: Border.fromBorderSide(BorderSide(color: Colors.white, width: 1.5)))),),
            ],
          ),
          const SizedBox(width: 14),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFFE2E8F0))),
            child: Row(
              children: const [
                CircleAvatar(backgroundColor: Color(0xFF6366F1), radius: 14, child: Text('AD', style: TextStyle(fontSize: 12, color: Colors.white, fontWeight: FontWeight.bold))),
                SizedBox(width: 10),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Admin', style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: Color(0xFF0F172A))),
                    Text('Super Admin', style: TextStyle(fontSize: 10.5, color: Color(0xFF94A3B8))),
                  ],
                ),
                SizedBox(width: 8),
                Icon(Icons.keyboard_arrow_down, size: 18, color: Color(0xFF94A3B8)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPageContent() {
    switch (activePage) {
      case 'customers':
        return const CustomersPage();
      case 'technicians':
        return const TechniciansPage();
      case 'jobs':
        return const JobsPage();
      case 'services':
        return const ServicesPage();
      case 'payments':
        return const PaymentsPage();
      case 'tracking':
        return const TrackingPage();
      case 'notifications':
        return const NotificationsPage();
      case 'reports':
        return const ReportsPage();
      case 'settings':
        return const SettingsPage();
      case 'dashboard':
      default:
        return const DashboardPage();
    }
  }
}

class DashboardPage extends StatelessWidget {
  const DashboardPage({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Wrap(
            spacing: 16,
            runSpacing: 16,
            children: statCards.map((stat) => StatCard(item: stat)).toList(),
          ),
          const SizedBox(height: 24),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: Column(children: [
                _SectionHeader(title: 'Service Requests Trend', subtitle: 'New vs completed over time'),
                _TrendSummary(),
                const SizedBox(height: 16),
                _SectionHeader(title: 'Technician Performance', subtitle: 'Jobs completed this month'),
                const PerformanceList(),
              ])),
              const SizedBox(width: 16),
              SizedBox(
                width: 320,
                child: Column(children: const [
                  _SectionHeader(title: 'Service Distribution', subtitle: 'By service type'),
                  _ServiceDistributionCard(),
                ]),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Expanded(child: Column(children: const [
              _SectionHeader(title: 'Recent Service Requests', subtitle: 'Latest jobs and status updates'),
              _JobsTableCard(),
            ])),
            const SizedBox(width: 16),
            const SizedBox(width: 320, child: ActivityPanel()),
          ]),
        ],
      ),
    );
  }
}

class CustomersPage extends StatefulWidget {
  const CustomersPage({super.key});

  @override
  State<CustomersPage> createState() => _CustomersPageState();
}

class _CustomersPageState extends State<CustomersPage> {
  String searchQuery = '';
  bool groupByStatus = false;

  @override
  Widget build(BuildContext context) {
    final filtered = customers.where((customer) {
      final query = searchQuery.toLowerCase();
      return customer['name']!.toLowerCase().contains(query) ||
          customer['email']!.toLowerCase().contains(query) ||
          customer['phone']!.toLowerCase().contains(query) ||
          customer['address']!.toLowerCase().contains(query);
    }).toList();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const _SectionHeader(title: 'Lead Management', subtitle: 'Keep track of customer requests'),
          const SizedBox(height: 16),
          Row(children: [
            Expanded(child: _SearchField(value: searchQuery, hintText: 'Search by name, email, phone or pincode…', onChanged: (value) => setState(() => searchQuery = value))),
            const SizedBox(width: 12),
            ElevatedButton.icon(
              onPressed: () => setState(() => groupByStatus = !groupByStatus),
              icon: const Icon(Icons.location_pin),
              label: Text(groupByStatus ? 'Grouped by Status' : 'Group by Status'),
            ),
          ]),
          const SizedBox(height: 20),
          CardWidget(child: Column(children: [
            ..._buildCustomerRows(filtered),
          ])),
        ],
      ),
    );
  }

  List<Widget> _buildCustomerRows(List<Map<String, String>> customers) {
    if (groupByStatus) {
      final buckets = <String, List<Map<String, String>>>{};
      for (var customer in customers) {
        final status = customer['status'] ?? 'Unknown';
        buckets.putIfAbsent(status, () => []).add(customer);
      }
      return buckets.entries.expand((entry) {
        return [
          Container(
            width: double.infinity,
            color: const Color(0xFFF8FAFC),
            padding: const EdgeInsets.all(12),
            child: Text('${entry.key} customers (${entry.value.length})', style: const TextStyle(fontWeight: FontWeight.w700)),
          ),
          ...entry.value.map((customer) => _CustomerRow(customer: customer)).toList(),
        ];
      }).toList();
    }

    return customers.map((customer) => _CustomerRow(customer: customer)).toList();
  }
}

class TechniciansPage extends StatelessWidget {
  const TechniciansPage({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        const _SectionHeader(title: 'User Management', subtitle: 'Technicians and staff details'),
        const SizedBox(height: 16),
        CardWidget(child: Column(children: technicians.map((tech) => _TechnicianRow(technician: tech)).toList())),
      ]),
    );
  }
}

class JobsPage extends StatelessWidget {
  const JobsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        const _SectionHeader(title: 'Service Requests', subtitle: 'All jobs and service requests'),
        const SizedBox(height: 16),
        Wrap(spacing: 10, runSpacing: 10, children: statusChips.map((label) => ChoiceChip(label: Text(label), selected: label == 'All')).toList()),
        const SizedBox(height: 16),
        CardWidget(child: Column(children: jobs.map((job) => _JobRow(job: job)).toList())),
      ]),
    );
  }
}

class ServicesPage extends StatelessWidget {
  const ServicesPage({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        const _SectionHeader(title: 'Services', subtitle: 'Available service offerings'),
        const SizedBox(height: 16),
        CardWidget(child: Column(children: serviceDistribution.map((item) => _SummaryRow(title: item['name']!, value: '${item['value']}%')).toList())),
      ]),
    );
  }
}

class PaymentsPage extends StatelessWidget {
  const PaymentsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        const _SectionHeader(title: 'Payments', subtitle: 'Recent billing activity'),
        const SizedBox(height: 16),
        CardWidget(child: Column(children: payments.map((payment) => _PaymentRow(payment: payment)).toList())),
      ]),
    );
  }
}

class TrackingPage extends StatelessWidget {
  const TrackingPage({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        const _SectionHeader(title: 'Live Tracking', subtitle: 'Technician locations and status'),
        const SizedBox(height: 16),
        CardWidget(child: Column(children: trackingTechs.map((tech) => _TrackingRow(tech: tech)).toList())),
      ]),
    );
  }
}

class NotificationsPage extends StatelessWidget {
  const NotificationsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        const _SectionHeader(title: 'Notifications', subtitle: 'Latest updates and alerts'),
        const SizedBox(height: 16),
        CardWidget(child: Column(children: notifications.map((notification) => _NotificationRow(notification: notification)).toList())),
      ]),
    );
  }
}

class ReportsPage extends StatelessWidget {
  const ReportsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        const _SectionHeader(title: 'Reports & Analytics', subtitle: 'Monthly and yearly performance'),
        const SizedBox(height: 16),
        CardWidget(child: Column(children: monthlyTrend.map((item) => _TrendRow(item: item)).toList())),
      ]),
    );
  }
}

class SettingsPage extends StatelessWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: const [
        _SectionHeader(title: 'Settings', subtitle: 'Configure your dashboard preferences'),
        SizedBox(height: 16),
        CardWidget(child: Padding(padding: EdgeInsets.all(16), child: Text('This page shows app settings and account preferences.', style: TextStyle(fontSize: 14)))),
      ]),
    );
  }
}

class StatCard extends StatelessWidget {
  final Map<String, dynamic> item;
  const StatCard({super.key, required this.item});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 260,
      child: CardWidget(
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(color: item['light'] as Color, borderRadius: BorderRadius.circular(12)),
                alignment: Alignment.center,
                child: Text(item['icon'] as String, style: const TextStyle(fontSize: 18)),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(color: (item['up'] as bool) ? const Color(0xFF10B981).withOpacity(0.12) : const Color(0xFFF43F5E).withOpacity(0.12), borderRadius: BorderRadius.circular(99)),
                child: Text('${(item['up'] as bool) ? '↑' : '↓'} ${item['trend']}', style: TextStyle(color: (item['up'] as bool) ? const Color(0xFF10B981) : const Color(0xFFF43F5E), fontSize: 11, fontWeight: FontWeight.w700)),
              ),
            ]),
            const SizedBox(height: 14),
            Text(item['value'] as String, style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: Color(0xFF0F172A))),
            const SizedBox(height: 4),
            Text(item['label'] as String, style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8), fontWeight: FontWeight.w500)),
            const SizedBox(height: 14),
            ClipRRect(
              borderRadius: BorderRadius.circular(99),
              child: LinearProgressIndicator(value: (statCards.indexOf(item) + 1) / 8, color: item['iconColor'] as Color, backgroundColor: const Color(0xFFF1F5F9), minHeight: 6),
            ),
          ]),
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  final String subtitle;
  const _SectionHeader({super.key, required this.title, required this.subtitle});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Color(0xFF1E293B))),
        const SizedBox(height: 6),
        Text(subtitle, style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
      ]),
    );
  }
}

class _TrendSummary extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: const Color(0xFFEEF2FF))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Weekly requests are strong and completed jobs are trending upward.', style: TextStyle(color: Color(0xFF475569), fontSize: 13)),
        const SizedBox(height: 14),
        ...trendData.map((item) => Padding(
          padding: const EdgeInsets.symmetric(vertical: 6),
          child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text(item['day'] as String, style: const TextStyle(fontSize: 13, color: Color(0xFF0F172A), fontWeight: FontWeight.w600)),
            Text('${item['requests']} req / ${item['completed']} done', style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
          ]),
        )).toList(),
      ]),
    );
  }
}

class PerformanceList extends StatelessWidget {
  const PerformanceList({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: const Color(0xFFEEF2FF))),
      child: Column(children: techPerf.map((tech) => Padding(
        padding: const EdgeInsets.only(bottom: 14),
        child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Expanded(child: Text(tech['name'] as String, style: const TextStyle(fontWeight: FontWeight.w600, color: Color(0xFF0F172A)))),
          Text('${tech['completed']} done', style: const TextStyle(color: Color(0xFF94A3B8))),
        ]),
      )).toList()),
    );
  }
}

class _ServiceDistributionCard extends StatelessWidget {
  const _ServiceDistributionCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: const Color(0xFFEEF2FF))),
      child: Column(children: serviceDistribution.map((item) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Row(children: [
            Container(width: 10, height: 10, decoration: BoxDecoration(color: item['color'] as Color, borderRadius: BorderRadius.circular(3))),
            const SizedBox(width: 10),
            Text(item['name'] as String, style: const TextStyle(color: Color(0xFF475569))),
          ]),
          Text('${item['value']}%', style: const TextStyle(fontWeight: FontWeight.w700)),
        ]),
      )).toList()),
    );
  }
}

class _JobsTableCard extends StatelessWidget {
  const _JobsTableCard({super.key});

  @override
  Widget build(BuildContext context) {
    return CardWidget(child: Column(children: jobs.map((job) => ListTile(
      title: Text(job['customer'] as String, style: const TextStyle(fontWeight: FontWeight.w600)),
      subtitle: Text('${job['service']} • ${job['date']}', style: const TextStyle(color: Color(0xFF64748B))),
      trailing: StatusBadge(status: job['status'] as String),
    )).toList()));
  }
}

class ActivityPanel extends StatelessWidget {
  const ActivityPanel({super.key});

  @override
  Widget build(BuildContext context) {
    return CardWidget(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          const Text('Live Activity', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Color(0xFF1E293B))),
          const SizedBox(height: 20),
          ...activities.map((activity) => Padding(
            padding: const EdgeInsets.only(bottom: 14),
            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(color: (activity['color'] as Color).withOpacity(0.12), borderRadius: BorderRadius.circular(12)),
                alignment: Alignment.center,
                child: Text(activity['icon'] as String),
              ),
              const SizedBox(width: 12),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(activity['msg'] as String, style: const TextStyle(fontWeight: FontWeight.w600, color: Color(0xFF1E293B))),
                const SizedBox(height: 4),
                Text(activity['sub'] as String, style: const TextStyle(color: Color(0xFF64748B), fontSize: 13)),
              ])),
              Text(activity['time'] as String, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
            ]),
          )).toList(),
        ]),
      ),
    );
  }
}

class _SearchField extends StatelessWidget {
  final String value;
  final String hintText;
  final ValueChanged<String> onChanged;

  const _SearchField({super.key, required this.value, required this.hintText, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return TextField(
      onChanged: onChanged,
      decoration: InputDecoration(
        hintText: hintText,
        filled: true,
        fillColor: Colors.white,
        prefixIcon: const Icon(Icons.search, color: Color(0xFF94A3B8)),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
      ),
    );
  }
}

class _CustomerRow extends StatelessWidget {
  final Map<String, String> customer;
  const _CustomerRow({super.key, required this.customer});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Color(0xFFF1F5F9)))),
      child: Row(children: [
        CircleAvatar(backgroundColor: const Color(0xFF6366F1), child: Text(customer['name']![0])),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(customer['name']!, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
          const SizedBox(height: 4),
          Text(customer['email']!, style: const TextStyle(color: Color(0xFF64748B))),
        ])),
        Text(customer['status']!, style: const TextStyle(color: Color(0xFF6366F1), fontWeight: FontWeight.w600)),
      ]),
    );
  }
}

class _TechnicianRow extends StatelessWidget {
  final Map<String, dynamic> technician;
  const _TechnicianRow({super.key, required this.technician});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Color(0xFFF1F5F9)))),
      child: Row(children: [
        CircleAvatar(backgroundColor: const Color(0xFF6366F1), child: Text(technician['avatar'] as String)),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(technician['name'] as String, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
          const SizedBox(height: 4),
          Text('${technician['specialization']} · ${technician['experience']}', style: const TextStyle(color: Color(0xFF64748B))),
        ])),
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          StatusBadge(status: technician['status'] as String),
          const SizedBox(height: 6),
          Text('${technician['assignedJobs']} assigned', style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
        ]),
      ]),
    );
  }
}

class _JobRow extends StatelessWidget {
  final Map<String, String> job;
  const _JobRow({super.key, required this.job});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Color(0xFFF1F5F9)))),
      child: Row(children: [
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(job['id']!, style: const TextStyle(fontFamily: 'monospace', color: Color(0xFF6366F1), fontWeight: FontWeight.w700)),
          const SizedBox(height: 6),
          Text(job['customer']!, style: const TextStyle(fontWeight: FontWeight.w600)),
          const SizedBox(height: 4),
          Text('${job['service']} • ${job['location']}', style: const TextStyle(color: Color(0xFF64748B))),
        ])),
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          StatusBadge(status: job['status']!),
          const SizedBox(height: 8),
          Text(job['date']!, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
        ]),
      ]),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  final String title;
  final String value;
  const _SummaryRow({super.key, required this.title, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Text(title, style: const TextStyle(color: Color(0xFF475569))),
        Text(value, style: const TextStyle(fontWeight: FontWeight.w700)),
      ]),
    );
  }
}

class _PaymentRow extends StatelessWidget {
  final Map<String, dynamic> payment;
  const _PaymentRow({super.key, required this.payment});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Color(0xFFF1F5F9)))),
      child: Row(children: [
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(payment['id'] as String, style: const TextStyle(fontWeight: FontWeight.w700)),
          const SizedBox(height: 6),
          Text('${payment['customer']} · ${payment['service']}', style: const TextStyle(color: Color(0xFF64748B))),
        ])),
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Text('₹${payment['amount']}', style: const TextStyle(fontWeight: FontWeight.w700)),
          const SizedBox(height: 6),
          StatusBadge(status: payment['status'] as String),
        ]),
      ]),
    );
  }
}

class _TrackingRow extends StatelessWidget {
  final Map<String, dynamic> tech;
  const _TrackingRow({super.key, required this.tech});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Color(0xFFF1F5F9)))),
      child: Row(children: [
        CircleAvatar(backgroundColor: const Color(0xFF6366F1), child: Text(tech['avatar'] as String)),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(tech['name'] as String, style: const TextStyle(fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          Text('${tech['job']} · ${tech['location']}', style: const TextStyle(color: Color(0xFF64748B))),
        ])),
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Text(tech['eta'] as String, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
          const SizedBox(height: 6),
          StatusBadge(status: tech['status'] as String),
        ]),
      ]),
    );
  }
}

class _NotificationRow extends StatelessWidget {
  final Map<String, String> notification;
  const _NotificationRow({super.key, required this.notification});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Color(0xFFF1F5F9)))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(notification['title']!, style: const TextStyle(fontWeight: FontWeight.w700)),
        const SizedBox(height: 4),
        Text(notification['desc']!, style: const TextStyle(color: Color(0xFF64748B))),
        const SizedBox(height: 6),
        Text(notification['time']!, style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
      ]),
    );
  }
}

class _TrendRow extends StatelessWidget {
  final Map<String, dynamic> item;
  const _TrendRow({super.key, required this.item});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Color(0xFFF1F5F9)))),
      child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(item['month'] as String, style: const TextStyle(fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          Text('Rev ₹${item['revenue']}', style: const TextStyle(color: Color(0xFF64748B), fontSize: 12)),
        ]),
        Text('${item['requests']}/${item['completed']}', style: const TextStyle(fontWeight: FontWeight.w700)),
      ]),
    );
  }
}

class PageTitle extends StatelessWidget {
  final String text;
  const PageTitle({super.key, required this.text});

  @override
  Widget build(BuildContext context) {
    return Text(text, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold));
  }
}

class CardWidget extends StatelessWidget {
  final Widget child;
  const CardWidget({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFF1F5F9)),
        boxShadow: const [BoxShadow(color: Color.fromRGBO(0, 0, 0, 0.03), blurRadius: 10, offset: Offset(0, 4))],
      ),
      child: child,
    );
  }
}

class StatusBadge extends StatelessWidget {
  final String status;
  const StatusBadge({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    final style = statusStyles[status] ?? statusStyles['Pending']!;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(color: style['bg'] as Color, borderRadius: BorderRadius.circular(99)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Container(width: 6, height: 6, decoration: BoxDecoration(color: style['dot'] as Color, shape: BoxShape.circle)),
        const SizedBox(width: 6),
        Text(status, style: TextStyle(color: style['color'] as Color, fontSize: 11, fontWeight: FontWeight.w700)),
      ]),
    );
  }
}

const pageTitles = {
  'dashboard': 'Dashboard',
  'customers': 'Customers',
  'technicians': 'Technicians',
  'jobs': 'Service Requests',
  'services': 'Services',
  'payments': 'Payments',
  'tracking': 'Live Tracking',
  'notifications': 'Notifications',
  'reports': 'Reports & Analytics',
  'settings': 'Settings',
};

const navItems = [
  {'id': 'dashboard', 'label': 'Dashboard', 'icon': Icons.dashboard, 'badge': null},
  {'id': 'customers', 'label': 'Customers', 'icon': Icons.group, 'badge': null},
  {'id': 'technicians', 'label': 'Technicians', 'icon': Icons.engineering, 'badge': null},
  {'id': 'jobs', 'label': 'Service Requests', 'icon': Icons.work, 'badge': null},
  {'id': 'services', 'label': 'Services', 'icon': Icons.build, 'badge': null},
  {'id': 'payments', 'label': 'Payments', 'icon': Icons.credit_card, 'badge': null},
  {'id': 'tracking', 'label': 'Live Tracking', 'icon': Icons.location_on, 'badge': null},
  {'id': 'notifications', 'label': 'Notifications', 'icon': Icons.notifications, 'badge': 3},
  {'id': 'reports', 'label': 'Reports & Analytics', 'icon': Icons.bar_chart, 'badge': null},
  {'id': 'settings', 'label': 'Settings', 'icon': Icons.settings, 'badge': null},
];

const statCards = [
  {'label': 'Total Requests', 'value': '1,284', 'trend': '+12%', 'up': true, 'icon': '📋', 'light': Color(0xFFEEF2FF), 'iconColor': Color(0xFF6366F1)},
  {'label': 'Pending Jobs', 'value': '87', 'trend': '+5%', 'up': false, 'icon': '⏳', 'light': Color(0xFFFFFBEB), 'iconColor': Color(0xFFF59E0B)},
  {'label': 'In Progress', 'value': '43', 'trend': '−2', 'up': false, 'icon': '🔄', 'light': Color(0xFFECFEFF), 'iconColor': Color(0xFF06B6D4)},
  {'label': 'Completed Jobs', 'value': '1,154', 'trend': '+18%', 'up': true, 'icon': '✅', 'light': Color(0xFFECFDF5), 'iconColor': Color(0xFF10B981)},
  {'label': 'Active Technicians', 'value': '28', 'trend': '+3', 'up': true, 'icon': '👷', 'light': Color(0xFFF5F3FF), 'iconColor': Color(0xFF8B5CF6)},
  {'label': 'Today Revenue', 'value': '₹48,200', 'trend': '+22%', 'up': true, 'icon': '💰', 'light': Color(0xFFFFF1F2), 'iconColor': Color(0xFFF43F5E)},
];

const trendData = [
  {'day': 'Mon', 'requests': 18, 'completed': 14},
  {'day': 'Tue', 'requests': 26, 'completed': 19},
  {'day': 'Wed', 'requests': 22, 'completed': 17},
  {'day': 'Thu', 'requests': 34, 'completed': 28},
  {'day': 'Fri', 'requests': 29, 'completed': 23},
  {'day': 'Sat', 'requests': 41, 'completed': 35},
  {'day': 'Sun', 'requests': 15, 'completed': 12},
];

const monthlyTrend = [
  {'month': 'Jan', 'requests': 120, 'completed': 98, 'revenue': 142000},
  {'month': 'Feb', 'requests': 145, 'completed': 118, 'revenue': 168000},
  {'month': 'Mar', 'requests': 132, 'completed': 109, 'revenue': 155000},
  {'month': 'Apr', 'requests': 168, 'completed': 141, 'revenue': 198000},
  {'month': 'May', 'requests': 155, 'completed': 130, 'revenue': 182000},
  {'month': 'Jun', 'requests': 189, 'completed': 158, 'revenue': 221000},
  {'month': 'Jul', 'requests': 201, 'completed': 172, 'revenue': 248000},
  {'month': 'Aug', 'requests': 178, 'completed': 150, 'revenue': 209000},
  {'month': 'Sep', 'requests': 215, 'completed': 188, 'revenue': 267000},
  {'month': 'Oct', 'requests': 234, 'completed': 198, 'revenue': 289000},
  {'month': 'Nov', 'requests': 220, 'completed': 192, 'revenue': 271000},
  {'month': 'Dec', 'requests': 248, 'completed': 210, 'revenue': 312000},
];

const serviceDistribution = [
  {'name': 'CCTV Installation', 'value': 32, 'color': Color(0xFF6366F1)},
  {'name': 'Laptop Repair', 'value': 28, 'color': Color(0xFF06B6D4)},
  {'name': 'Desktop Service', 'value': 18, 'color': Color(0xFFF59E0B)},
  {'name': 'Networking Setup', 'value': 14, 'color': Color(0xFF10B981)},
  {'name': 'AMC Maintenance', 'value': 8, 'color': Color(0xFFF43F5E)},
];

const techPerf = [
  {'name': 'Arjun M.', 'completed': 42, 'inProgress': 3},
  {'name': 'Suresh K.', 'completed': 38, 'inProgress': 2},
  {'name': 'Vikram R.', 'completed': 35, 'inProgress': 4},
  {'name': 'Deepa T.', 'completed': 29, 'inProgress': 2},
  {'name': 'Manoj P.', 'completed': 24, 'inProgress': 1},
  {'name': 'Preethi S.', 'completed': 31, 'inProgress': 3},
];

const jobs = [
  {'id': 'TBS-1042', 'customer': 'Ravi Kumar', 'service': 'CCTV Installation', 'tech': 'Arjun M.', 'status': 'In Progress', 'date': '09 Mar 2026', 'location': 'Koramangala, BLR'},
  {'id': 'TBS-1041', 'customer': 'Priya Nair', 'service': 'Laptop Repair', 'tech': 'Suresh K.', 'status': 'Completed', 'date': '09 Mar 2026', 'location': 'Indiranagar, BLR'},
  {'id': 'TBS-1040', 'customer': 'Dinesh Patel', 'service': 'Networking Setup', 'tech': '—', 'status': 'Pending', 'date': '08 Mar 2026', 'location': 'HSR Layout, BLR'},
  {'id': 'TBS-1039', 'customer': 'Ananya Sharma', 'service': 'AMC Maintenance', 'tech': 'Vikram R.', 'status': 'Assigned', 'date': '08 Mar 2026', 'location': 'Whitefield, BLR'},
  {'id': 'TBS-1038', 'customer': 'Sanjay Mehta', 'service': 'Desktop Service', 'tech': 'Arjun M.', 'status': 'Completed', 'date': '07 Mar 2026', 'location': 'BTM Layout, BLR'},
  {'id': 'TBS-1037', 'customer': 'Lakshmi Rao', 'service': 'CCTV Installation', 'tech': '—', 'status': 'Cancelled', 'date': '07 Mar 2026', 'location': 'Jayanagar, BLR'},
  {'id': 'TBS-1036', 'customer': 'Harish Iyer', 'service': 'Laptop Repair', 'tech': 'Suresh K.', 'status': 'In Progress', 'date': '06 Mar 2026', 'location': 'Electronic City, BLR'},
  {'id': 'TBS-1035', 'customer': 'Meena Krishnan', 'service': 'Networking Setup', 'tech': 'Preethi S.', 'status': 'Assigned', 'date': '06 Mar 2026', 'location': 'Marathahalli, BLR'},
];

const customers = [
  {'name': 'Ravi Kumar', 'phone': '+91 98765 43210', 'email': 'ravi.kumar@email.com', 'address': 'Koramangala, Bangalore', 'status': 'Active'},
  {'name': 'Priya Nair', 'phone': '+91 87654 32109', 'email': 'priya.nair@email.com', 'address': 'Indiranagar, Bangalore', 'status': 'Active'},
  {'name': 'Dinesh Patel', 'phone': '+91 76543 21098', 'email': 'dinesh.p@email.com', 'address': 'HSR Layout, Bangalore', 'status': 'Active'},
  {'name': 'Ananya Sharma', 'phone': '+91 65432 10987', 'email': 'ananya.s@email.com', 'address': 'Whitefield, Bangalore', 'status': 'Active'},
  {'name': 'Sanjay Mehta', 'phone': '+91 54321 09876', 'email': 'sanjay.m@email.com', 'address': 'BTM Layout, Bangalore', 'status': 'VIP'},
  {'name': 'Lakshmi Rao', 'phone': '+91 43210 98765', 'email': 'lakshmi.r@email.com', 'address': 'Jayanagar, Bangalore', 'status': 'Inactive'},
];

const technicians = [
  {'name': 'Arjun Menon', 'phone': '+91 98001 11234', 'specialization': 'CCTV Installation', 'status': 'On Job', 'assignedJobs': 3, 'rating': 4.8, 'experience': '5 yrs', 'avatar': 'AM'},
  {'name': 'Suresh Kumar', 'phone': '+91 97001 22345', 'specialization': 'Laptop / Desktop', 'status': 'On Job', 'assignedJobs': 2, 'rating': 4.6, 'experience': '4 yrs', 'avatar': 'SK'},
  {'name': 'Vikram Reddy', 'phone': '+91 96001 33456', 'specialization': 'Networking', 'status': 'Available', 'assignedJobs': 0, 'rating': 4.7, 'experience': '6 yrs', 'avatar': 'VR'},
  {'name': 'Deepa Thomas', 'phone': '+91 95001 44567', 'specialization': 'AMC Maintenance', 'status': 'Available', 'assignedJobs': 0, 'rating': 4.5, 'experience': '3 yrs', 'avatar': 'DT'},
  {'name': 'Manoj Pillai', 'phone': '+91 94001 55678', 'specialization': 'CCTV Installation', 'status': 'Offline', 'assignedJobs': 0, 'rating': 4.3, 'experience': '2 yrs', 'avatar': 'MP'},
  {'name': 'Preethi Srinivas', 'phone': '+91 93001 66789', 'specialization': 'Networking', 'status': 'On Job', 'assignedJobs': 3, 'rating': 4.9, 'experience': '7 yrs', 'avatar': 'PS'},
];

const payments = [
  {'id': 'PAY-8821', 'customer': 'Priya Nair', 'service': 'Laptop Repair', 'amount': 2800, 'status': 'Paid', 'date': '09 Mar 2026'},
  {'id': 'PAY-8820', 'customer': 'Sanjay Mehta', 'service': 'Desktop Service', 'amount': 1500, 'status': 'Paid', 'date': '07 Mar 2026'},
  {'id': 'PAY-8819', 'customer': 'Harish Iyer', 'service': 'Laptop Repair', 'amount': 3200, 'status': 'Pending', 'date': '06 Mar 2026'},
  {'id': 'PAY-8818', 'customer': 'Meena Krishnan', 'service': 'Networking Setup', 'amount': 8500, 'status': 'Paid', 'date': '06 Mar 2026'},
  {'id': 'PAY-8817', 'customer': 'Ravi Kumar', 'service': 'CCTV Installation', 'amount': 24000, 'status': 'Partial', 'date': '05 Mar 2026'},
  {'id': 'PAY-8816', 'customer': 'Ananya Sharma', 'service': 'AMC Maintenance', 'amount': 12000, 'status': 'Paid', 'date': '05 Mar 2026'},
];

const trackingTechs = [
  {'name': 'Arjun M.', 'job': 'TBS-1042', 'location': 'Koramangala', 'eta': 'En route • 8 min', 'status': 'On Job', 'avatar': 'AM'},
  {'name': 'Suresh K.', 'job': 'TBS-1036', 'location': 'Electronic City', 'eta': 'On-site', 'status': 'On Job', 'avatar': 'SK'},
  {'name': 'Vikram R.', 'job': '—', 'location': 'Whitefield', 'eta': 'Available', 'status': 'Available', 'avatar': 'VR'},
  {'name': 'Preethi S.', 'job': 'TBS-1035', 'location': 'Marathahalli', 'eta': 'On-site', 'status': 'On Job', 'avatar': 'PS'},
];

const notifications = [
  {'title': 'New service request assigned', 'desc': 'TBS-1042 assigned to Arjun Menon', 'time': '2 min ago'},
  {'title': 'Job completed', 'desc': 'TBS-1041 marked completed by Suresh Kumar', 'time': '28 min ago'},
  {'title': 'Payment received', 'desc': '₹2,800 from Priya Nair for TBS-1041', 'time': '31 min ago'},
  {'title': 'Customer cancellation', 'desc': 'TBS-1037 cancelled by Lakshmi Rao', 'time': '1 hr ago'},
  {'title': 'Technician offline', 'desc': 'Manoj Pillai went offline', 'time': '2 hrs ago'},
  {'title': 'New customer registered', 'desc': 'Harish Iyer from Electronic City', 'time': '2 hrs ago'},
  {'title': 'AMC renewal due', 'desc': '3 AMC contracts expiring this week', 'time': '5 hrs ago'},
];

const statusChips = ['All', 'Pending', 'Assigned', 'In Progress', 'Completed', 'Cancelled'];

const statusStyles = {
  'Pending': {'bg': Color(0xFFFDE68A), 'color': Color(0xFFB45309), 'dot': Color(0xFFF59E0B)},
  'Assigned': {'bg': Color(0xFFE0E7FF), 'color': Color(0xFF4338CA), 'dot': Color(0xFF6366F1)},
  'In Progress': {'bg': Color(0xFFE0F2FE), 'color': Color(0xFF0369A1), 'dot': Color(0xFF06B6D4)},
  'Completed': {'bg': Color(0xFFD1FAE5), 'color': Color(0xFF166534), 'dot': Color(0xFF10B981)},
  'Cancelled': {'bg': Color(0xFFFECACA), 'color': Color(0xFF991B1B), 'dot': Color(0xFFF43F5E)},
  'Paid': {'bg': Color(0xFFD1FAE5), 'color': Color(0xFF166534), 'dot': Color(0xFF10B981)},
  'Partial': {'bg': Color(0xFFFDE68A), 'color': Color(0xFF92400E), 'dot': Color(0xFFF59E0B)},
  'Active': {'bg': Color(0xFFD1FAE5), 'color': Color(0xFF166534), 'dot': Color(0xFF10B981)},
  'VIP': {'bg': Color(0xFFFDE68A), 'color': Color(0xFF92400E), 'dot': Color(0xFFF59E0B)},
  'Inactive': {'bg': Color(0xFFE2E8F0), 'color': Color(0xFF475569), 'dot': Color(0xFF64748B)},
  'Available': {'bg': Color(0xFFD1FAE5), 'color': Color(0xFF166534), 'dot': Color(0xFF10B981)},
  'On Job': {'bg': Color(0xFFE0F2FE), 'color': Color(0xFF0369A1), 'dot': Color(0xFF06B6D4)},
  'Offline': {'bg': Color(0xFFE2E8F0), 'color': Color(0xFF475569), 'dot': Color(0xFF64748B)},
};
