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
  State<NewsPile> createState() => NewsPileState();
}

class NewsPileState extends State<NewsPile> with SingleTickerProviderStateMixin {
  var _ready = false;
  var _open = false;
  var _all = false;
  var _busy = false;
  var _snapping = false;
  var _dir = 0;
  var _index = 0;
  var _drag = 0.0;
  var _snapFrom = 0.0;
  List<String> _seen = const [];
  late final AnimationController _commit;

  @override
  void initState() {
    super.initState();
    _commit = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 240),
    )..addListener(() {
      if (_snapping) {
        setState(() => _drag = _snapFrom * (1 - _commit.value));
      } else {
        setState(() {});
      }
    })..addStatusListener((status) {
      if (status == AnimationStatus.completed) _onCommitDone();
    });
    _load();
  }

  @override
  void dispose() {
    _commit.dispose();
    super.dispose();
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

  void openAll() {
    if (!_ready || _open || newsDrops.isEmpty) return;
    setState(() {
      _all = true;
      _index = 0;
      _drag = 0;
      _open = _slides.isNotEmpty;
    });
  }

  Future<void> _close() async {
    final ids = {..._seen, ..._slides.map((slide) => slide.dropId)}.toList();
    if (mounted) setState(() => _open = false);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_seenKey, jsonEncode(ids));
    if (!mounted) return;
    setState(() {
      _seen = ids;
      _all = false;
      _index = 0;
      _drag = 0;
      _dir = 0;
      _busy = false;
      _snapping = false;
    });
    _commit.value = 0;
  }

  void _onCommitDone() {
    if (!mounted) return;
    if (_snapping) {
      setState(() {
        _snapping = false;
        _drag = 0;
        _busy = false;
      });
      _commit.value = 0;
      return;
    }
    final dir = _dir;
    final done = dir > 0 && _index + 1 >= _slides.length;
    if (done) {
      _close();
      return;
    }
    setState(() {
      _dir = 0;
      _drag = 0;
      _busy = false;
      if (dir > 0) _index += 1;
      if (dir < 0 && _index > 0) _index -= 1;
    });
    _commit.value = 0;
  }

  void _snapBack() {
    _snapFrom = _drag;
    _snapping = true;
    _busy = true;
    _commit.forward(from: 0);
  }

  Future<void> _step(int delta) async {
    if (_busy || _dir != 0) return;
    final next = _index + delta;
    if (next < 0) return;
    if (_reduce) {
      if (next >= _slides.length) {
        await _close();
      } else {
        setState(() => _index = next);
      }
      return;
    }
    setState(() {
      _busy = true;
      _dir = delta > 0 ? 1 : -1;
    });
    _commit.forward(from: 0);
  }

  @override
  Widget build(BuildContext context) {
    if (!_ready || !_open || _slides.isEmpty) return const SizedBox.shrink();
    return _sheet(context);
  }

  Widget _sheet(BuildContext context) {
    final strings = context.strings;
    final bs = Settings.of(context).language == AppLanguage.bs;
    final slides = _slides;
    final index = _index.clamp(0, slides.length - 1);

    return LayoutBuilder(
      builder: (context, constraints) {
        const inset = 32.0;
        const padTop = 36.0;
        const padBottom = 16.0;
        final width = math.min(400.0, constraints.maxWidth - inset * 2 - 24);
        final maxHeight = constraints.maxHeight - padTop - padBottom;
        final shown = <int>[
          for (var i = 0; i < slides.length; i++)
            if (_shows(i, index, slides.length)) i,
        ]..sort((a, b) => _layerZ(a, index).compareTo(_layerZ(b, index)));
        return GestureDetector(
          onTap: _close,
          child: ColoredBox(
            color: const Color(0x99060C20),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(inset, padTop, inset, padBottom),
              child: Center(
                child: GestureDetector(
                  onTap: () {},
                  onHorizontalDragUpdate: (details) {
                    if (_busy) return;
                    setState(() {
                      _drag += details.delta.dx;
                      if (index == 0 && _drag > 0) _drag = 0;
                    });
                  },
                  onHorizontalDragEnd: (details) {
                    if (_busy) return;
                    final velocity = details.primaryVelocity ?? 0;
                    final drag = _drag;
                    final next = drag < -72 || velocity < -500;
                    final prev =
                        index > 0 && !next && (drag > 72 || velocity > 500);
                    if (next) {
                      _step(1);
                    } else if (prev) {
                      _step(-1);
                    } else {
                      _snapBack();
                    }
                  },
                  child: SizedBox(
                    width: width,
                    child: Stack(
                      clipBehavior: Clip.none,
                      children: [
                        for (final i in shown)
                          _placed(
                            context,
                            i: i,
                            index: index,
                            width: width,
                            slides: slides,
                            maxHeight: maxHeight,
                            bs: bs,
                            strings: strings,
                          ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  bool _shows(int i, int index, int length) {
    if (i < 0 || i >= length) return false;
    if (i == index) return true;
    if (i > index && i <= index + 2) return true;
    return i == index - 1 && _dir < 0;
  }

  int _layerZ(int i, int index) {
    if (_dir > 0 && i == index) return 100;
    if (_dir < 0 && i == index - 1) return 90;
    if (i == index) return 80;
    return 20 - (i - index);
  }

  Offset _cardOffset(int i, int index, double width) {
    final t = _dir == 0 ? 0.0 : _commit.value;
    if (_dir > 0) {
      if (i == index) return Offset(_mix(_drag, -width * 1.15, t), 0);
      final back = (i - index) - t;
      return Offset(back * 14, back * 12);
    }
    if (_dir < 0) {
      if (i == index) return Offset(_mix(_drag, 14, t), _mix(0, 12, t));
      if (i == index - 1) return Offset(_mix(-72, 0, t), 0);
      final depth = (i - index).toDouble();
      return Offset(_mix(_drag + depth * 14, (depth + 1) * 14, t), (depth + t) * 12);
    }
    if (i == index) return Offset(_drag, 0);
    final depth = (i - index).toDouble();
    if (_drag > 0) return Offset(_drag + depth * 14, depth * 12);
    final pull = (-_drag / 140).clamp(0.0, 1.0);
    final back = depth - pull;
    return Offset(back * 14, back * 12);
  }

  double _mix(double a, double b, double t) => a + (b - a) * t;

  /// Peek cards sit at a slight positive tilt. The front card rocks to a
  /// negative tilt along the same progress as the slide.
  double _tilt(int i, int index) {
    const peek = 0.02;
    const face = -0.035;
    final t = _dir == 0 ? 0.0 : _commit.value;
    final forwardPull = _drag < 0 ? (-_drag / 140).clamp(0.0, 1.0) : 0.0;
    final backPull = _drag > 0 ? (_drag / 140).clamp(0.0, 1.0) : 0.0;
    if (_dir > 0) {
      if (i == index) return _mix(_mix(face, peek, forwardPull), peek, t);
      if (i == index + 1) return _mix(_mix(peek, face, forwardPull), face, t);
      return peek;
    }
    if (_dir < 0) {
      if (i == index) return _mix(face, peek, t);
      if (i == index - 1) return _mix(_mix(peek, face, backPull), face, t);
      return peek;
    }
    if (i == index) return _mix(face, peek, forwardPull);
    if (i == index + 1) return _mix(peek, face, forwardPull);
    if (i == index - 1) return _mix(peek, face, backPull);
    return peek;
  }

  Widget _placed(
    BuildContext context, {
    required int i,
    required int index,
    required double width,
    required double maxHeight,
    required List<_Slide> slides,
    required bool bs,
    required AppStrings strings,
  }) {
    final offset = _cardOffset(i, index, width);
    final leaving = _dir > 0 && i == index;
    final front = (i == index && _dir >= 0) || (i == index - 1 && _dir < 0);
    final showNav = front || (_dir > 0 && i == index + 1);
    return Transform.translate(
      offset: offset,
      child: Transform.rotate(
        angle: _tilt(i, index),
        child: Opacity(
          opacity: leaving ? (1 - _commit.value).clamp(0.0, 1.0) : 1,
          child: IgnorePointer(
            ignoring: !front || _busy,
            child: _card(
              context,
              slide: slides[i],
              n: i + 1,
              bs: bs,
              strings: strings,
              maxHeight: maxHeight,
              showNav: showNav,
            ),
          ),
        ),
      ),
    );
  }

  Widget _card(
    BuildContext context, {
    required _Slide slide,
    required int n,
    required bool bs,
    required AppStrings strings,
    required double maxHeight,
    required bool showNav,
  }) {
    final ink = showInk(context);
    final palette = context.palette;
    return Stack(
      clipBehavior: Clip.none,
      children: [
        Container(
          width: double.infinity,
          constraints: BoxConstraints(maxHeight: maxHeight),
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
              Flexible(
                child: Image.asset(
                  slide.card.image,
                  height: 150,
                  fit: BoxFit.contain,
                ),
              ),
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
              if (showNav) ...[
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
                      label: n == _slides.length ? strings.newsGotIt : strings.newsNext,
                      onTap: _busy ? null : () => _step(1),
                      filled: true,
                    ),
                  ],
                ),
              ],
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

class NewsStamp extends StatelessWidget {
  const NewsStamp({super.key, required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final night = Theme.of(context).brightness == Brightness.dark;
    return Semantics(
      button: true,
      label: context.strings.newsWhatsNew,
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: showPanel(
            ink: showInk(context),
            fill: night ? context.palette.card : Colors.white,
            radius: 12,
            shadow: const Offset(0, 4),
          ),
          child: Icon(
            Icons.campaign,
            size: 16,
            color: night ? Colors.white : showInkDay,
          ),
        ),
      ),
    );
  }
}
