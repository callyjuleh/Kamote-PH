import 'package:flutter/widgets.dart';
import 'package:flutter_svg/flutter_svg.dart';

/// The exact 24x24 stroke icon set used by the web build.
const Map<String, String> _paths = {
  'home': '<path d="M3 10.8 12 3l9 7.8"/><path d="M5.5 9.5V21h13V9.5M9 21v-7h6v7"/>',
  'library': '<path d="M4 4.5h5.5v15H4zM10 4.5h5.5v15H10z"/><path d="m16.5 5 3.2-.8 3.2 14.4-3.2.8z"/>',
  'study': '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h10M7 13h6"/>',
  'spark':
      '<path d="m12 2 1.2 4.1a6.6 6.6 0 0 0 4.7 4.7L22 12l-4.1 1.2a6.6 6.6 0 0 0-4.7 4.7L12 22l-1.2-4.1a6.6 6.6 0 0 0-4.7-4.7L2 12l4.1-1.2a6.6 6.6 0 0 0 4.7-4.7z"/>',
  'user': '<circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>',
  'search': '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  'arrow': '<path d="M5 12h14M14 7l5 5-5 5"/>',
  'chevron': '<path d="m9 18 6-6-6-6"/>',
  'bookmark': '<path d="M6 3.5h12v17L12 17l-6 3.5z"/>',
  'shuffle':
      '<path d="M3 7h3c5 0 7 10 12 10h3"/><path d="m18 14 3 3-3 3M3 17h3c2 0 3.5-1.6 5-4M15 7c1-1 2-1 3-1h3M18 3l3 3-3 3"/>',
  'check': '<path d="m5 12 4.5 4.5L19 7"/>',
  'close': '<path d="m6 6 12 12M18 6 6 18"/>',
  'send': '<path d="m3 4 18 8-18 8 3-8zm3 8h15"/>',
  'clock': '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  'cards': '<rect x="5" y="3" width="14" height="17" rx="2"/><path d="M9 7h6M9 11h6"/>',
  'sign': '<path d="M12 3 4 9v9h16V9zM12 18v3"/><circle cx="12" cy="10.5" r="2.5"/>',
  'rules': '<path d="M6 3h12v18H6zM9 8h6M9 12h6M9 16h4"/>',
  'marking': '<path d="M8 3h8l3 18H5zM12 4v4M12 11v4M12 18v2"/>',
  'exam': '<path d="M7 4h10a2 2 0 0 1 2 2v15H5V6a2 2 0 0 1 2-2Z"/><path d="M9 3h6v3H9zM9 11l2 2 4-4M9 17h6"/>',
  'flame':
      '<path d="M13 2s1 5-3 8c-2 1.5-3 3.5-2 6a4.4 4.4 0 0 0 8.5-.5c.5-3-1.5-5.5-2.5-7.5 0 3-2 4-2 4s1-4-1-6c-1.5 3-5 5-6 8.5C3.8 19 7.5 22 12 22a8 8 0 0 0 8-8c0-5-3-8.5-7-12Z"/>',
  'settings':
      '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/>',
  'back': '<path d="m15 18-6-6 6-6"/>',
  'bell': '<path d="M6 9a6 6 0 0 1 12 0c0 6.5 2.5 8 2.5 8h-17S6 15.5 6 9Z"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/>',
  'signal':
      '<rect x="8" y="2.5" width="8" height="19" rx="3"/><circle cx="12" cy="7" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="17" r="1.6"/>',
  'plus': '<path d="M12 5v14M5 12h14"/>',
  'upright': '<path d="M7 17 17 7M8.5 7H17v8.5"/>',
};

class RWIcon extends StatelessWidget {
  const RWIcon(this.name, {super.key, this.size = 20, this.color, this.stroke = 1.8});

  final String name;
  final double size;
  final Color? color;
  final double stroke;

  @override
  Widget build(BuildContext context) {
    final tint = color ?? IconTheme.of(context).color ?? const Color(0xFF1D1D1F);
    final svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000000" '
        'stroke-width="$stroke" stroke-linecap="round" stroke-linejoin="round">${_paths[name] ?? ''}</svg>';
    return SvgPicture.string(
      svg,
      width: size,
      height: size,
      colorFilter: ColorFilter.mode(tint, BlendMode.srcIn),
    );
  }
}