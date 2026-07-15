package com.tiendaflics.tiendaflics_backend.config;

import com.tiendaflics.tiendaflics_backend.entities.Categoria;
import com.tiendaflics.tiendaflics_backend.entities.Cliente;
import com.tiendaflics.tiendaflics_backend.entities.UsuarioPersonal;
import com.tiendaflics.tiendaflics_backend.repositories.CategoriaRepository;
import com.tiendaflics.tiendaflics_backend.repositories.ClienteRepository;
import com.tiendaflics.tiendaflics_backend.repositories.UsuarioPersonalRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

/**
 * Crea datos mínimos de demostración (usuario ADMIN/VENDEDOR y categorías) la primera vez
 * que la aplicación arranca contra una base de datos vacía (ej. un entorno nuevo desplegado).
 * También migra en caliente cualquier password que haya quedado en texto plano de antes de
 * introducir BCrypt (datos reales preexistentes), re-hasheándolo con el valor que ya tenía.
 * Todo es idempotente: si ya está migrado/creado, no hace nada.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private static final Pattern BCRYPT_PATTERN = Pattern.compile("^\\$2[aby]\\$\\d{2}\\$.{53}$");

    private final UsuarioPersonalRepository usuarioPersonalRepository;
    private final ClienteRepository clienteRepository;
    private final CategoriaRepository categoriaRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UsuarioPersonalRepository usuarioPersonalRepository,
                       ClienteRepository clienteRepository,
                       CategoriaRepository categoriaRepository,
                       PasswordEncoder passwordEncoder) {
        this.usuarioPersonalRepository = usuarioPersonalRepository;
        this.clienteRepository = clienteRepository;
        this.categoriaRepository = categoriaRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        migrarPasswordsPlanasABcrypt();

        crearUsuarioStaffSiNoExiste("admin", "Administrador Flics", UsuarioPersonal.Rol.ADMIN, "admin123");
        crearUsuarioStaffSiNoExiste("vendedor1", "Vendedor Demo", UsuarioPersonal.Rol.VENDEDOR, "vendedor123");

        if (categoriaRepository.count() == 0) {
            Categoria bebidas = new Categoria();
            bebidas.setNombre("Bebidas");
            categoriaRepository.save(bebidas);

            Categoria snacks = new Categoria();
            snacks.setNombre("Snacks");
            categoriaRepository.save(snacks);
        }
    }

    private void migrarPasswordsPlanasABcrypt() {
        usuarioPersonalRepository.findAll().forEach(usuario -> {
            if (!esBcrypt(usuario.getPassword())) {
                usuario.setPassword(passwordEncoder.encode(usuario.getPassword()));
                usuarioPersonalRepository.save(usuario);
            }
        });

        clienteRepository.findAll().forEach(cliente -> {
            if (cliente.getPassword() != null && !esBcrypt(cliente.getPassword())) {
                cliente.setPassword(passwordEncoder.encode(cliente.getPassword()));
                clienteRepository.save(cliente);
            }
        });
    }

    private boolean esBcrypt(String password) {
        return password != null && BCRYPT_PATTERN.matcher(password).matches();
    }

    private void crearUsuarioStaffSiNoExiste(String idUsuario, String nombre, UsuarioPersonal.Rol rol, String passwordPlano) {
        if (usuarioPersonalRepository.findByIdUsuarioAndActivoTrue(idUsuario).isPresent()) {
            return;
        }

        UsuarioPersonal usuario = new UsuarioPersonal();
        usuario.setNombre(nombre);
        usuario.setIdUsuario(idUsuario);
        usuario.setRol(rol);
        usuario.setPassword(passwordEncoder.encode(passwordPlano));
        usuario.setActivo(true);
        usuarioPersonalRepository.save(usuario);
    }
}
