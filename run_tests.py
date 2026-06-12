import test_api

def run_all_tests():
    tests = [
        ("Login Validation", test_api.test_login),
        ("Filters Retrieval", test_api.test_filters),
        ("Companies Database Query", test_api.test_companies),
        ("ML Risk Predictor", test_api.test_predict),
        ("Portfolio Rebalancer", test_api.test_portfolio_rebalance),
        ("AI Coach Intent Chat", test_api.test_chat),
        ("User Tier Pro Upgrade", test_api.test_upgrade),
        ("End-to-End Referral Sign Up", test_api.test_referral_signup),
        ("2FA Enforced Secure Login", test_api.test_two_factor_auth_login),
        ("Developer API Key End-to-End", test_api.test_developer_api_keys),
    ]
    
    print("==================================================")
    print("        RUNNING BACKEND VERIFICATION TESTS        ")
    print("==================================================")
    
    # Start the test server
    print("Starting test server thread...")
    test_api.start_server()
    
    passed_count = 0
    try:
        for name, test_func in tests:
            try:
                print(f"Running: {name}...", end="", flush=True)
                test_func()
                print(" [PASSED]")
                passed_count += 1
            except Exception as e:
                print(f" [FAILED]")
                print(f"Error details: {e}")
                import traceback
                traceback.print_exc()
    finally:
        print("Stopping test server thread...")
        test_api.stop_server()
            
    print("==================================================")
    print(f"Result: {passed_count}/{len(tests)} tests passed.")
    print("==================================================")
    
    if passed_count == len(tests):
        print("All verification checks passed successfully!")
    else:
        exit(1)

if __name__ == "__main__":
    run_all_tests()
