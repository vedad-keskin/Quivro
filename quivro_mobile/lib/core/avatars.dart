import 'package:flutter/material.dart';

/// Shared avatar contract with web (index 0..7).
const avatarColors = <Color>[
  Color(0xFF22D3EE),
  Color(0xFFF97316),
  Color(0xFFEC4899),
  Color(0xFF84CC16),
  Color(0xFF2F7CF6),
  Color(0xFF7B3FF2),
  Color(0xFFEAB308),
  Color(0xFF14B8A6),
];

const avatarEmojis = <String>[
  '😎',
  '🦊',
  '🐯',
  '🐸',
  '🤖',
  '🦄',
  '🦁',
  '🐼',
];

const answerColors = <Color>[
  Color(0xFF22D3EE),
  Color(0xFFF97316),
  Color(0xFFEC4899),
  Color(0xFF84CC16),
];

const answerLabels = <String>['A', 'B', 'C', 'D'];

Color avatarColor(int index) => avatarColors[index.clamp(0, 7)];

String avatarEmoji(int index) => avatarEmojis[index.clamp(0, 7)];

abstract final class QuivroColors {
  static const blue = Color(0xFF2F7CF6);
  static const purple = Color(0xFF7B3FF2);
  static const navy = Color(0xFF1E293B);
  static const muted = Color(0xFF64748B);
  static const border = Color(0xFFE2E8F0);
  static const surface = Color(0xFFF8FAFC);
}
