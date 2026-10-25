import Foundation
import Capacitor
import UIKit

/**
 * App-local Capacitor plugin: lets the web layer recolor the native window,
 * root view and web view behind the page. The window shows through the
 * keyboard's rounded corners while the web view is resized, so it has to
 * follow the in-app theme (which is independent of the device appearance).
 * Registered from MainViewController.capacitorDidLoad().
 */
@objc(WindowBackgroundPlugin)
public class WindowBackgroundPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "WindowBackgroundPlugin"
    public let jsName = "WindowBackground"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "setColor", returnType: CAPPluginReturnPromise)
    ]

    @objc func setColor(_ call: CAPPluginCall) {
        guard let hex = call.getString("color"), let color = WindowBackgroundPlugin.color(fromHex: hex) else {
            call.reject("Expected a #RRGGBB color")
            return
        }
        DispatchQueue.main.async {
            let viewController = self.bridge?.viewController
            viewController?.view.window?.backgroundColor = color
            viewController?.view.backgroundColor = color
            self.bridge?.webView?.backgroundColor = color
            self.bridge?.webView?.scrollView.backgroundColor = color
            call.resolve()
        }
    }

    private static func color(fromHex hex: String) -> UIColor? {
        var digits = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        if digits.hasPrefix("#") { digits.removeFirst() }
        guard digits.count == 6, let value = UInt32(digits, radix: 16) else { return nil }
        return UIColor(
            red: CGFloat((value >> 16) & 0xFF) / 255.0,
            green: CGFloat((value >> 8) & 0xFF) / 255.0,
            blue: CGFloat(value & 0xFF) / 255.0,
            alpha: 1.0
        )
    }
}
