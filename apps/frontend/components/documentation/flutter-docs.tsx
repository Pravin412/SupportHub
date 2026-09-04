import { CodeBlock } from "./code-block";

export function FlutterDocs() {
  return (
    <div className="p-5 space-y-4 text-sm text-slate-700">
      <h3 className="font-semibold text-lg text-slate-900">Flutter Mobile Integration</h3>
      <p>In Flutter apps, use the <code>webview_flutter</code> package to open the chat interface full-screen or in a bottom sheet modal.</p>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 space-y-2">
        <h4 className="font-semibold text-slate-900">Implementation steps</h4>
        <ol className="list-decimal space-y-1 pl-4">
          <li>Use the frontend widget URL, not the backend API URL.</li>
          <li>Load <code>/widget</code> inside the WebView.</li>
          <li>Send <code>channelId</code>, <code>profileId</code>, <code>name</code>, <code>email</code>, and <code>number</code> as URL query parameters.</li>
          <li>Use <code>postMessage</code> only when the user details become available after the WebView is already open.</li>
          <li>For Android emulator testing, use <code>10.0.2.2:3000</code>. For real devices, use the computer's LAN IP.</li>
        </ol>
      </div>

      <div className="rounded-md border border-amber-200 bg-amber-50/50 p-4 text-xs text-amber-900 space-y-1">
        <div className="font-semibold">Local Testing Note:</div>
        <div>
          When testing on an <b>Android Emulator</b>, use <code>10.0.2.2:3000</code> instead of <code>localhost:3000</code>. On physical devices, use your computer's local IP (e.g. <code>192.168.x.x:3000</code>) and bind your dev servers to <code>0.0.0.0</code>.
        </div>
      </div>
      
      <CodeBlock
        code={`import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

class SupportHubChatModal extends StatefulWidget {
  final String channelId;
  final String? profileId;
  final String? userName;

  const SupportHubChatModal({
    Key? key,
    required this.channelId,
    this.profileId,
    this.userName,
  }) : super(key: key);

  @override
  State<SupportHubChatModal> createState() => _SupportHubChatModalState();
}

class _SupportHubChatModalState extends State<SupportHubChatModal> {
  late final WebViewController controller;

  @override
  void initState() {
    super.initState();
    // Use 10.0.2.2 for Android Emulators
    final uri = Uri.http('10.0.2.2:3000', '/widget', {
      'channelId': widget.channelId,
      if (widget.profileId != null) 'profileId': widget.profileId,
      if (widget.userName != null) 'name': widget.userName,
    });

    controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..loadRequest(uri);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Live Support')),
      body: WebViewWidget(controller: controller),
    );
  }
}`}
      />
      
      <div className="mt-4">
        <h4 className="font-semibold text-slate-800">Dynamic User Session Updates</h4>
        <p className="mt-1 text-slate-600 mb-2">If you need to identify the user dynamically <i>after</i> the WebView has already loaded, dispatch a message to the WebView:</p>
        <CodeBlock
          code={`controller.runJavaScript('''
  window.postMessage({
    type: 'supporthub-set-user',
    profileId: 'USER_123',
    name: 'Jane Doe'
  }, '*');
''');`}
        />
      </div>
    </div>
  );
}
