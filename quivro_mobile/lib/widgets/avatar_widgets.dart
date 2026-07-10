import 'package:flutter/material.dart';
import '../core/avatars.dart';

class AvatarBadge extends StatelessWidget {
  const AvatarBadge({
    super.key,
    required this.index,
    this.size = 48,
  });

  final int index;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: avatarColor(index),
        shape: BoxShape.circle,
      ),
      child: Text(
        avatarEmoji(index),
        style: TextStyle(fontSize: size * 0.48),
      ),
    );
  }
}

class AvatarPicker extends StatelessWidget {
  const AvatarPicker({
    super.key,
    required this.selected,
    required this.onSelected,
  });

  final int selected;
  final ValueChanged<int> onSelected;

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      padding: const EdgeInsets.only(bottom: 8),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 4,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 1,
      ),
      itemCount: avatarCount,
      itemBuilder: (context, i) {
        final isSelected = i == selected;
        return GestureDetector(
          onTap: () => onSelected(i),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 160),
            padding: const EdgeInsets.all(3),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: isSelected ? QuivroColors.blue : Colors.transparent,
                width: 3,
              ),
            ),
            child: Center(child: AvatarBadge(index: i, size: 52)),
          ),
        );
      },
    );
  }
}
