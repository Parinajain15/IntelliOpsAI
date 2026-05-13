using Microsoft.AspNetCore.Mvc;

namespace IntelliOpsAI.Controllers
{
    public class AccountController : Controller
    {
        public IActionResult Login()
        {
            return View();
        }

        [HttpPost]
        public IActionResult Login(string email, string password)
        {
            // temporary simple check (no database yet)
            if (email == "admin@intelliops.com" && password == "admin")
            {
                return RedirectToAction("Index", "Home");
            }

            ViewBag.Error = "Invalid credentials";
            return View();
        }
    }
}