import UIKit
import Capacitor

/// Capacitor's bridge view controller plus the app-local plugins.
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(WindowBackgroundPlugin())
    }
}
