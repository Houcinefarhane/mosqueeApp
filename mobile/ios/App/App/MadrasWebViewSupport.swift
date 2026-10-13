import UIKit
import WebKit
import Capacitor

/// Diagnostics WebView + retry après timeout (-1001), sans sous-classer CAPBridgeViewController.
enum MadrasWebViewSupport {

    private static var viewDidAppearObserver: NSObjectProtocol?
    private static var didBecomeActiveObserver: NSObjectProtocol?
    private static weak var bridgeViewController: CAPBridgeViewController?
    private static var navigationLogger: MadrasWebViewNavigationLogger?

    static func install() {
        guard viewDidAppearObserver == nil else { return }

        viewDidAppearObserver = NotificationCenter.default.addObserver(
            forName: .capacitorViewDidAppear,
            object: nil,
            queue: .main
        ) { _ in
            attachNavigationProxyIfNeeded()
        }

        didBecomeActiveObserver = NotificationCenter.default.addObserver(
            forName: UIApplication.didBecomeActiveNotification,
            object: nil,
            queue: .main
        ) { _ in
            retryMainLoadIfNeeded(reason: "didBecomeActive")
        }
    }

    private static func attachNavigationProxyIfNeeded() {
        guard let bridgeVC = findBridgeViewController() else {
            print("[MadrasApp] attachNavigationProxy — CAPBridgeViewController introuvable")
            return
        }
        bridgeViewController = bridgeVC

        guard let webView = bridgeVC.webView else {
            print("[MadrasApp] attachNavigationProxy — webView nil")
            return
        }

        if navigationLogger == nil {
            let server = bridgeVC.bridge?.config.appStartServerURL.absoluteString ?? "(nil)"
            print("[MadrasApp] attachNavigationProxy — server.url=\(server)")

            let logger = MadrasWebViewNavigationLogger(
                forwarding: webView.navigationDelegate,
                reload: { [weak bridgeVC] in
                    guard let url = bridgeVC?.bridge?.config.appStartServerURL else { return }
                    _ = bridgeVC?.webView?.load(URLRequest(url: url))
                }
            )
            navigationLogger = logger
            webView.navigationDelegate = logger
            if #available(iOS 16.4, *) {
                webView.isInspectable = true
                print("[MadrasApp] webView.isInspectable = true")
            }
            print("[MadrasApp] WKNavigationDelegate proxy installé")
        }
    }

    private static func findBridgeViewController() -> CAPBridgeViewController? {
        let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
        for scene in scenes {
            for window in scene.windows {
                if let bridge = window.rootViewController as? CAPBridgeViewController {
                    return bridge
                }
                if let bridge = window.rootViewController?.children.first as? CAPBridgeViewController {
                    return bridge
                }
            }
        }
        return nil
    }

    private static func retryMainLoadIfNeeded(reason: String) {
        guard let bridgeVC = bridgeViewController ?? findBridgeViewController(),
              let webView = bridgeVC.webView,
              let url = bridgeVC.bridge?.config.appStartServerURL else {
            return
        }

        if let current = webView.url?.absoluteString, current.hasPrefix(url.absoluteString), webView.estimatedProgress >= 0.9 {
            return
        }

        guard let logger = navigationLogger else { return }
        logger.scheduleRetryLoad {
            print("[MadrasApp] reload server.url (\(reason))")
            _ = webView.load(URLRequest(url: url))
        }
    }
}

/// Forwarder WKNavigationDelegate : logs + signale les timeouts pour retry.
final class MadrasWebViewNavigationLogger: NSObject, WKNavigationDelegate {

    private weak var forwarding: WKNavigationDelegate?
    private let reload: () -> Void
    private var retryCount = 0
    private let maxRetries = 3
    private var retryScheduled = false

    init(forwarding: WKNavigationDelegate?, reload: @escaping () -> Void) {
        self.forwarding = forwarding
        self.reload = reload
    }

    func scheduleRetryLoad(_ action: @escaping () -> Void) {
        guard retryCount < maxRetries, !retryScheduled else { return }
        retryScheduled = true
        retryCount += 1
        let delay = 2.0 * Double(retryCount)
        print("[MadrasApp] retry planifié \(retryCount)/\(maxRetries) dans \(delay)s")
        DispatchQueue.main.asyncAfter(deadline: .now() + delay) { [weak self] in
            self?.retryScheduled = false
            action()
        }
    }

    override func responds(to aSelector: Selector!) -> Bool {
        if super.responds(to: aSelector) {
            return true
        }
        return forwarding?.responds(to: aSelector) ?? false
    }

    override func forwardingTarget(for aSelector: Selector!) -> Any? {
        forwarding
    }

    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        print("[MadrasApp] WK didStartProvisionalNavigation url=\(webView.url?.absoluteString ?? "nil")")
        forwarding?.webView?(webView, didStartProvisionalNavigation: navigation)
    }

    func webView(_ webView: WKWebView, didCommit navigation: WKNavigation!) {
        print("[MadrasApp] WK didCommit url=\(webView.url?.absoluteString ?? "nil")")
        forwarding?.webView?(webView, didCommit: navigation)
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        retryCount = 0
        print("[MadrasApp] WK didFinish url=\(webView.url?.absoluteString ?? "nil")")
        forwarding?.webView?(webView, didFinish: navigation)
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        print("[MadrasApp] WK didFail error=\(error.localizedDescription)")
        forwarding?.webView?(webView, didFail: navigation, withError: error)
        handleLoadError(error, webView: webView)
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        print("[MadrasApp] WK didFailProvisionalNavigation error=\(error.localizedDescription)")
        forwarding?.webView?(webView, didFailProvisionalNavigation: navigation, withError: error)
        handleLoadError(error, webView: webView)
    }

    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        print("[MadrasApp] WK webViewWebContentProcessDidTerminate url=\(webView.url?.absoluteString ?? "nil")")
        forwarding?.webViewWebContentProcessDidTerminate?(webView)
    }

    private func handleLoadError(_ error: Error, webView: WKWebView) {
        let ns = error as NSError
        guard ns.domain == NSURLErrorDomain, ns.code == NSURLErrorTimedOut else { return }
        scheduleRetryLoad(reload)
    }
}
