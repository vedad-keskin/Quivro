import 'dart:convert';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../core/settings.dart';
import '../core/strings.dart';
import '../core/theme.dart';

const _seenKey = 'quivro.news.seen';

class NewsCard {
  const NewsCard({
    required this.image,
    required this.accent,
    required this.titleEn,
    required this.titleBs,
    required this.bodyEn,
    required this.bodyBs,
  });

  final String image;
  final Color accent;
  final String titleEn;
  final String titleBs;
  final String bodyEn;
  final String bodyBs;

  String title(bool bs) => bs ? titleBs : titleEn;
  String body(bool bs) => bs ? bodyBs : bodyEn;
}

class NewsDrop {
  const NewsDrop({required this.id, required this.cards});

  final String id;
  final List<NewsCard> cards;
}

/// Newest first. A new announcement is one object at the top, with a new id.
const newsDrops = <NewsDrop>[
  NewsDrop(
    id: 'power-ups',
    cards: [
      NewsCard(
        image: 'assets/powerups/fifty_fifty.png',
        accent: Color(0xFF22D3EE),
        titleEn: '50/50 is here',
        titleBs: '50/50 je stigao',
        bodyEn:
            'Not sure which answer is right? Narrow down your choices and improve your odds. Two wrong answers disappear, leaving you with two answers to choose from.',
        bodyBs:
            'Nisi siguran koji je odgovor tačan? Suzi izbor i povećaj svoje šanse. Dva pogrešna odgovora nestaju, ostavljajući ti dva odgovora za izbor.',
      ),
      NewsCard(
        image: 'assets/powerups/second_chance.png',
        accent: Color(0xFFF97316),
        titleEn: 'Second Chance is here',
        titleBs: 'Second Chance je stigao',
        bodyEn:
            'Know the answer but not completely sure? Take a shot without risking the question. Pick an answer first; if it is wrong, you get one more chance to choose.',
        bodyBs:
            'Znaš odgovor, ali nisi potpuno siguran? Probaj bez straha da ćeš odmah izgubiti pitanje. Odaberi odgovor, ako nije tačan, dobijaš još jednu šansu za izbor.',
      ),
      NewsCard(
        image: 'assets/powerups/lock_up.png',
        accent: Color(0xFFEC4899),
        titleEn: 'Lock Up is here',
        titleBs: 'Lock Up je stigao',
        bodyEn:
            'Know the answer and want an advantage? Lock yourself and a random opponent out of the question. You stay safe while your opponent loses the chance to answer.',
        bodyBs:
            'Znaš odgovor i želiš prednost? Zaključaj sebe i nasumičnog protivnika iz pitanja. Ti si siguran, dok protivnik gubi mogućnost odgovaranja.',
      ),
    ],
  ),
];

class _Slide {
  const _Slide(this.dropId, this.card);
  final String dropId;
  final NewsCard card;
}

List<_Slide> _visible({required bool all, required List<String> seen}) {
  final drops = all
      ? newsDrops
      : newsDrops.where((drop) => !seen.contains(drop.id));
  return [
    for (final drop in drops)
      for (final card in drop.cards) _Slide(drop.id, card),
  ];
}

/// Yellow megaphone in the bottom right. Opens the same pile as the web.
class NewsPile extends StatefulWidget {
  const NewsPile({super.key});

  @override
  State<NewsPile> createState() => _NewsPileState();
}

class _NewsPileState extends State<NewsPile> {
  var _ready = false;
  var _open = false;
  var _all = false;
  var _busy = false;
  var _leaving = false;
  var _dragging = false;
  var _index = 0;
  var _drag = 0.0;
  List<String> _seen = const [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_seenKey);
    var seen = <String>[];
    if (raw != null) {
      try {
        final parsed = jsonDecode(raw);
        if (parsed is List) seen = parsed.whereType<String>().toList();
      } catch (_) {}
    }
    if (!mounted) return;
    final unread = _visible(all: false, seen: seen);
    setState(() {
      _seen = seen;
      _ready = true;
      _open = unread.isNotEmpty;
      _all = false;
      _index = 0;
    });
  }

  List<_Slide> get _slides => _visible(all: _all, seen: _seen);

  bool get _reduce => MediaQuery.disableAnimationsOf(context);

  void _openAll() {
    if (_open || newsDrops.isEmpty) return;
    setState(() {
      _all = true;
      _index = 0;
      _drag = 0;
      _open = _slides.isNotEmpty;
    });
  }

  Future<void> _close() async {
    final ids = {..._seen, ..._slides.map((slide) => slide.dropId)}.toList();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_seenKey, jsonEncode(ids));
    if (!mounted) return;
    setState(() {
      _seen = ids;
      _open = false;
      _all = false;
      _index = 0;
      _drag = 0;
      _leaving = false;
      _busy = false;
    });
  }

  Future<void> _finish() async {
    if (_busy) return;
    if (_reduce) {
      await _close();
      return;
    }
    setState(() {
      _busy = true;
      _leaving = true;
      _drag = 0;
    });
    await Future<void>.delayed(const Duration(milliseconds: 240));
    if (!mounted) return;
    await _close();
  }

  Future<void> _step(int delta) async {
    if (_busy) return;
    final next = _index + delta;
    if (next < 0) return;
    if (next >= _slides.length) {
      await _finish();
      return;
    }
    if (delta > 0 && !_reduce) {
      setState(() {
        _busy = true;
        _leaving = true;
        _drag = 0;
      });
      await Future<void>.delayed(const Duration(milliseconds: 240));
      if (!mounted) return;
      setState(() {
        _index = next;
        _leaving = false;
        _busy = false;
        _drag = 0;
      });
      return;
    }
    setState(() {
      _index = next;
      _drag = 0;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!_ready) return const SizedBox.shrink();
    final bottom = MediaQuery.paddingOf(context).bottom;
    return Stack(
      children: [
        Positioned(
          right: 16,
          bottom: bottom + 12,
          child: _Stamp(onTap: _openAll),
        ),
        if (_open && _slides.isNotEmpty)
          Positioned.fill(child: _sheet(context)),
      ],
    );
  }

  Widget _sheet(BuildContext context) {
    final strings = context.strings;
    final bs = Settings.of(context).language == AppLanguage.bs;
    final slides = _slides;
    final index = _index.clamp(0, slides.length - 1);
    final slide = slides[index];
    final ahead = <({_Slide slide, int back, int n})>[
      for (var i = slides.length - 1; i > index; i--)
        (slide: slides[i], back: i - index, n: i + 1),
    ];
    final last = index == slides.length - 1;

    return LayoutBuilder(
      builder: (context, constraints) {
        final width = math.min(400.0, constraints.maxWidth - 56);
        return GestureDetector(
          onTap: _close,
          child: ColoredBox(
            color: const Color(0x99060C20),
            child: Center(
              child: GestureDetector(
                onTap: () {},
                onHorizontalDragStart: (_) => setState(() => _dragging = true),
                onHorizontalDragUpdate: (details) {
                  if (_busy) return;
                  setState(() => _drag += details.delta.dx);
                },
                onHorizontalDragEnd: (details) {
                  final velocity = details.primaryVelocity ?? 0;
                  final drag = _drag;
                  final next = drag < -72 || velocity < -500;
                  final prev = !next && (drag > 72 || velocity > 500);
                  if (!next && !prev) {
                    setState(() {
                      _dragging = false;
                      _drag = 0;
                    });
                    return;
                  }
                  setState(() => _dragging = false);
                  if (next) {
                    _step(1);
                  } else {
                    _step(-1);
                  }
                },
                child: SizedBox(
                  width: width + 36,
                  child: Stack(
                    clipBehavior: Clip.none,
                    children: [
                      for (final peek in ahead)
                        Positioned(
                          left: peek.back * 14,
                          top: peek.back * 12,
                          right: 36 - peek.back * 14,
                          bottom: -peek.back * 12,
                          child: DecoratedBox(
                            decoration: showPanel(
                              ink: showInk(context),
                              fill: Color.alphaBlend(
                                peek.slide.card.accent.withValues(alpha: 0.24),
                                context.palette.card,
                              ),
                            ),
                          ),
                        ),
                      Padding(
                        padding: const EdgeInsets.only(right: 36),
                        child: TweenAnimationBuilder<double>(
                          tween: Tween(
                            end: _leaving ? -width * 1.15 : _drag,
                          ),
                          duration: _dragging
                              ? Duration.zero
                              : const Duration(milliseconds: 240),
                          curve: Curves.easeOut,
                          builder: (context, x, child) => Transform.translate(
                            offset: Offset(x, 0),
                            child: Transform.rotate(
                              angle: -0.035,
                              child: child,
                            ),
                          ),
                          child: _card(
                            context,
                            slide: slide,
                            n: index + 1,
                            bs: bs,
                            strings: strings,
                            last: last,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _card(
    BuildContext context, {
    required _Slide slide,
    required int n,
    required bool bs,
    required AppStrings strings,
    required bool last,
  }) {
    final ink = showInk(context);
    final palette = context.palette;
    return Stack(
      clipBehavior: Clip.none,
      children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.fromLTRB(18, 28, 18, 16),
          decoration: showPanel(
            ink: ink,
            fill: Color.alphaBlend(
              slide.card.accent.withValues(alpha: 0.24),
              palette.card,
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Image.asset(slide.card.image, width: 150, height: 150),
              const SizedBox(height: 8),
              Text(
                slide.card.title(bs),
                textAlign: TextAlign.center,
                style: showDisplay(
                  context,
                  fontSize: 26,
                  letterSpacing: 0.4,
                  color: palette.text,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                slide.card.body(bs),
                textAlign: TextAlign.center,
                style: GoogleFonts.nunito(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  height: 1.35,
                  color: palette.muted,
                ),
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  _navButton(
                    context,
                    label: strings.newsPrev,
                    onTap: _index == 0 || _busy ? null : () => _step(-1),
                    filled: false,
                  ),
                  const Spacer(),
                  _navButton(
                    context,
                    label: last ? strings.newsGotIt : strings.newsNext,
                    onTap: _busy ? null : () => _step(1),
                    filled: true,
                  ),
                ],
              ),
            ],
          ),
        ),
        Positioned(
          top: -16,
          left: -12,
          child: Transform.rotate(
            angle: -0.14,
            child: Container(
              width: 42,
              height: 42,
              alignment: Alignment.center,
              decoration: showPanel(
                ink: ink,
                fill: slide.card.accent,
                radius: 21,
                shadow: const Offset(2, 2),
              ),
              child: Text(
                '$n',
                style: showDisplay(
                  context,
                  fontSize: 22,
                  color: showInkDay,
                ),
              ),
            ),
          ),
        ),
        Positioned(
          top: 14,
          left: 36,
          child: Text(
            strings.newsWhatsNew.toUpperCase(),
            style: showDisplay(
              context,
              fontSize: 16,
              letterSpacing: 0.8,
              color: palette.text,
            ),
          ),
        ),
        Positioned(
          top: 10,
          right: 10,
          child: GestureDetector(
            onTap: _close,
            child: Container(
              width: 32,
              height: 32,
              alignment: Alignment.center,
              decoration: showPanel(
                ink: ink,
                fill: palette.card,
                radius: 9,
                shadow: const Offset(0, 3),
              ),
              child: Text(
                '×',
                style: showDisplay(context, fontSize: 20, color: palette.text),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _navButton(
    BuildContext context, {
    required String label,
    required VoidCallback? onTap,
    required bool filled,
  }) {
    final ink = showInk(context);
    return GestureDetector(
      onTap: onTap,
      child: Opacity(
        opacity: onTap == null ? 0.45 : 1,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: showPanel(
            ink: ink,
            fill: filled ? showBulb : context.palette.card,
            radius: 12,
            shadow: const Offset(0, 4),
          ),
          child: Text(
            label.toUpperCase(),
            style: showDisplay(
              context,
              fontSize: 16,
              color: filled ? showInkDay : context.palette.text,
            ),
          ),
        ),
      ),
    );
  }
}

class _Stamp extends StatelessWidget {
  const _Stamp({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: context.strings.newsWhatsNew,
      child: GestureDetector(
        onTap: onTap,
        child: Transform.rotate(
          angle: -0.14,
          child: Container(
            width: 56,
            height: 56,
            alignment: Alignment.center,
            decoration: showPanel(
              ink: showInk(context),
              fill: showBulb,
              radius: 28,
              shadow: const Offset(2, 2),
            ),
            child: const Icon(Icons.campaign, size: 30, color: showInkDay),
          ),
        ),
      ),
    );
  }
}
